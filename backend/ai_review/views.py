import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

from accounts.models import TeamMember
from tenders.models import Tender
from .models import CompanyProfile, AIReview, HumanFeedback
from .serializers import (
    CompanyProfileSerializer, AIReviewSerializer,
    HumanFeedbackSerializer, HumanFeedbackCreateSerializer,
    TenderSuggestionSerializer,
)
from .services.reviewer import run_review

logger = logging.getLogger(__name__)

_TAG = 'AI Review'


def _get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


# ---------------------------------------------------------------------------
# Company Profile
# ---------------------------------------------------------------------------

@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get company profile',
        description=(
            'Returns the workspace company profile used for AI tender matching. '
            'Returns 404 if onboarding has not been completed yet.'
        ),
        responses={
            200: CompanyProfileSerializer,
            404: OpenApiResponse(description='Profile not found — complete onboarding first'),
        },
    ),
    put=extend_schema(
        tags=[_TAG],
        summary='Create or update company profile',
        description=(
            'Creates or fully replaces the workspace company profile. '
            'Set `onboarding_completed: true` once the profile is ready for AI matching.\n\n'
            '| Field | Description |\n'
            '|---|---|\n'
            '| `company_name` | Legal entity name |\n'
            '| `description` | What the company does |\n'
            '| `capabilities` | List of capability strings (e.g. `["Cloud Migration", "DevOps"]`) |\n'
            '| `certifications` | Held certifications (e.g. `["ISO 27001", "Cyber Essentials Plus"]`) |\n'
            '| `sectors` | Primary sectors served (e.g. `["Healthcare", "Defence"]`) |\n'
            '| `typical_contract_min` | Lower bound of typical contract value (£) |\n'
            '| `typical_contract_max` | Upper bound of typical contract value (£) |\n'
            '| `excluded_keywords` | Auto-disqualify tenders containing these terms |\n'
            '| `preferred_notice_types` | OCDS notice types to prioritise (e.g. `["tender"]`) |\n'
            '| `onboarding_completed` | Set to `true` to enable AI reviews |\n'
        ),
        request=CompanyProfileSerializer,
        responses={200: CompanyProfileSerializer},
    ),
    patch=extend_schema(
        tags=[_TAG],
        summary='Partially update company profile',
        description='Same as PUT but only the supplied fields are updated.',
        request=CompanyProfileSerializer,
        responses={200: CompanyProfileSerializer},
    ),
)
class CompanyProfileView(generics.GenericAPIView):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]

    def _get_profile_or_none(self, workspace):
        try:
            return workspace.company_profile
        except CompanyProfile.DoesNotExist:
            return None

    def get(self, request):
        workspace = _get_workspace(request.user)
        profile = self._get_profile_or_none(workspace)
        if not profile:
            return Response({'detail': 'Company profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CompanyProfileSerializer(profile).data)

    def put(self, request):
        workspace = _get_workspace(request.user)
        profile = self._get_profile_or_none(workspace)
        serializer = CompanyProfileSerializer(
            profile, data=request.data, partial=False
        ) if profile else CompanyProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=workspace)
        return Response(serializer.data)

    def patch(self, request):
        workspace = _get_workspace(request.user)
        profile = self._get_profile_or_none(workspace)
        if not profile:
            return Response({'detail': 'Company profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# AI Review — trigger + retrieve
# ---------------------------------------------------------------------------

@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get AI review for a tender',
        description=(
            'Returns the most recent AI review for the given tender in the workspace. '
            'Returns 404 if no review exists yet — use POST to trigger one.'
        ),
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        responses={
            200: AIReviewSerializer,
            404: OpenApiResponse(description='Review not found'),
        },
    ),
    post=extend_schema(
        tags=[_TAG],
        summary='Trigger AI review for a tender',
        description=(
            'Runs Claude AI against the tender and the workspace company profile, '
            'returning a structured review with scores, risk level, capability alignment '
            'and a recommendation.\n\n'
            '**Prerequisites**: the company profile must exist and `onboarding_completed` must be `true`.\n\n'
            'If a review already exists it is overwritten with a fresh result. '
            'The review is saved to the database and returned in the response.'
        ),
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        request=None,
        responses={
            200: AIReviewSerializer,
            400: OpenApiResponse(description='Company profile incomplete or onboarding not done'),
            404: OpenApiResponse(description='Tender not found'),
            502: OpenApiResponse(description='Claude API error'),
        },
    ),
)
class TenderReviewView(generics.GenericAPIView):
    serializer_class = AIReviewSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, ref_id):
        workspace = _get_workspace(request.user)
        review = AIReview.objects.filter(
            tender__ref_id=ref_id, workspace=workspace
        ).select_related('tender', 'human_feedback').first()
        if not review:
            return Response({'detail': 'No review found for this tender.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AIReviewSerializer(review).data)

    def post(self, request, ref_id):
        workspace = _get_workspace(request.user)
        tender = generics.get_object_or_404(Tender, ref_id=ref_id)

        try:
            profile = workspace.company_profile
        except CompanyProfile.DoesNotExist:
            return Response(
                {'detail': 'Company profile not found. Complete onboarding first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not profile.onboarding_completed:
            return Response(
                {'detail': 'Company onboarding is not completed. Set onboarding_completed to true.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review, _ = AIReview.objects.get_or_create(
            tender=tender, workspace=workspace,
            defaults={'review_status': AIReview.ReviewStatus.PENDING},
        )
        review.review_status = AIReview.ReviewStatus.PENDING
        review.error_message = ''
        review.save(update_fields=['review_status', 'error_message'])

        try:
            result = run_review(tender, profile)
        except Exception as exc:
            logger.exception('AI review failed for %s', ref_id)
            review.review_status = AIReview.ReviewStatus.FAILED
            review.error_message = str(exc)
            review.save(update_fields=['review_status', 'error_message'])
            return Response({'detail': f'AI review failed: {exc}'}, status=status.HTTP_502_BAD_GATEWAY)

        review.ai_score = result.get('ai_score')
        review.feasibility_score = result.get('feasibility_score')
        review.risk_level = result.get('risk_level')
        review.capability_alignment = result.get('capability_alignment', [])
        review.executive_summary = result.get('executive_summary', '')
        review.recommendation = result.get('recommendation')
        review.rationale = result.get('rationale', '')
        review.review_status = AIReview.ReviewStatus.COMPLETED
        review.model_used = "claude-haiku-4-5"#'claude-opus-4-7'
        review.save()

        return Response(AIReviewSerializer(review).data)


# ---------------------------------------------------------------------------
# Human Feedback
# ---------------------------------------------------------------------------

@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get human feedback for a review',
        description='Returns the human feedback submitted for the AI review of the given tender.',
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        responses={
            200: HumanFeedbackSerializer,
            404: OpenApiResponse(description='Feedback or review not found'),
        },
    ),
    post=extend_schema(
        tags=[_TAG],
        summary='Submit human feedback on an AI review',
        description=(
            'Records a reviewer\'s verdict on an AI review. '
            'If the reviewer disagrees with the AI recommendation, set `override_recommendation` '
            'to the correct value (`pursue`, `review`, or `skip`).\n\n'
            '| Field | Description |\n'
            '|---|---|\n'
            '| `agreed_with_recommendation` | Boolean — did the reviewer agree with AI? |\n'
            '| `override_recommendation` | Optional override if disagreeing |\n'
            '| `feedback_text` | Free-text notes for the team |\n'
        ),
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        request=HumanFeedbackCreateSerializer,
        responses={
            200: HumanFeedbackSerializer,
            400: OpenApiResponse(description='Feedback already submitted — use PATCH to update'),
            404: OpenApiResponse(description='AI review not found'),
        },
    ),
    patch=extend_schema(
        tags=[_TAG],
        summary='Update human feedback',
        description='Updates an existing human feedback record.',
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        request=HumanFeedbackCreateSerializer,
        responses={200: HumanFeedbackSerializer},
    ),
)
class TenderFeedbackView(generics.GenericAPIView):
    serializer_class = HumanFeedbackSerializer
    permission_classes = [IsAuthenticated]

    def _get_review(self, ref_id, workspace):
        return generics.get_object_or_404(AIReview, tender__ref_id=ref_id, workspace=workspace)

    def get(self, request, ref_id):
        workspace = _get_workspace(request.user)
        review = self._get_review(ref_id, workspace)
        try:
            return Response(HumanFeedbackSerializer(review.human_feedback).data)
        except HumanFeedback.DoesNotExist:
            return Response({'detail': 'No feedback submitted yet.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, ref_id):
        workspace = _get_workspace(request.user)
        review = self._get_review(ref_id, workspace)
        if hasattr(review, 'human_feedback'):
            return Response(
                {'detail': 'Feedback already exists. Use PATCH to update.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = HumanFeedbackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(ai_review=review, reviewer=request.user)
        return Response(HumanFeedbackSerializer(feedback).data)

    def patch(self, request, ref_id):
        workspace = _get_workspace(request.user)
        review = self._get_review(ref_id, workspace)
        try:
            feedback = review.human_feedback
        except HumanFeedback.DoesNotExist:
            return Response({'detail': 'No feedback found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = HumanFeedbackCreateSerializer(feedback, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(HumanFeedbackSerializer(feedback).data)


# ---------------------------------------------------------------------------
# Suggested tenders
# ---------------------------------------------------------------------------

@extend_schema(
    tags=[_TAG],
    summary='Get AI-suggested tenders',
    description=(
        'Returns the top tenders that have been AI-reviewed and recommended as `pursue` or `review`, '
        'ordered by AI score descending. Useful for the discovery page "AI Recommendations" widget.\n\n'
        'Only tenders with a completed review are returned. Use `POST /api/ai-review/tenders/{ref_id}/review/` '
        'to trigger reviews for individual tenders.'
    ),
    parameters=[
        OpenApiParameter('limit', OpenApiTypes.INT, description='Max results to return (default 20, max 100)'),
        OpenApiParameter(
            'recommendation', OpenApiTypes.STR,
            description='Filter by recommendation: `pursue`, `review`, `skip` (default: pursue,review)',
        ),
    ],
    responses={200: TenderSuggestionSerializer(many=True)},
)
class SuggestedTendersView(generics.GenericAPIView):
    serializer_class = TenderSuggestionSerializer
    permission_classes = [IsAuthenticated]
    queryset = AIReview.objects.none()

    def get(self, request):
        workspace = _get_workspace(request.user)
        limit = min(int(request.query_params.get('limit', 20)), 100)
        rec_filter = request.query_params.get('recommendation', '')
        recs = [r.strip() for r in rec_filter.split(',') if r.strip()] if rec_filter else ['pursue', 'review']

        reviews = (
            AIReview.objects
            .filter(workspace=workspace, review_status=AIReview.ReviewStatus.COMPLETED, recommendation__in=recs)
            .select_related('tender')
            .order_by('-ai_score')[:limit]
        )

        data = []
        for r in reviews:
            t = r.tender
            data.append({
                'ref_id': t.ref_id,
                'title': t.title,
                'organization': t.organization,
                'deadline': t.deadline,
                'budget_min': float(t.budget_min) if t.budget_min is not None else None,
                'budget_max': float(t.budget_max) if t.budget_max is not None else None,
                'industry': t.industry,
                'ai_score': r.ai_score,
                'feasibility_score': r.feasibility_score,
                'risk_level': r.risk_level,
                'recommendation': r.recommendation,
                'executive_summary': r.executive_summary,
            })

        serializer = TenderSuggestionSerializer(data, many=True)
        return Response(serializer.data)
