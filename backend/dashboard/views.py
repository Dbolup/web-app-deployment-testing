from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse,
    inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

from accounts.models import TeamMember
from tenders.models import Tender, TenderScore
from pipeline.models import PipelineItem
from ai_review.models import AIReview
from tenders.serializers import TenderListSerializer
from .models import Activity
from .serializers import ActivitySerializer

_TAG = 'Dashboard'


def get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


_stats_response = inline_serializer(
    name='DashboardStats',
    fields={
        'total_tenders': drf_serializers.IntegerField(help_text='Total tenders in the database'),
        'ai_qualified': drf_serializers.IntegerField(help_text='Items in AI Qualified, Under Review, In Progress or Viable stages'),
        'in_progress': drf_serializers.IntegerField(help_text='Items currently in the In Progress stage'),
        'submitted': drf_serializers.IntegerField(help_text='Items in the Submitted stage'),
        'trend_data': drf_serializers.ListField(
            child=inline_serializer(
                name='TrendPoint',
                fields={
                    'date': drf_serializers.DateField(help_text='Calendar date'),
                    'count': drf_serializers.IntegerField(help_text='Number of tenders first seen on this date'),
                },
            ),
            help_text='Daily tender discovery counts for the requested window',
        ),
    },
)


@extend_schema(
    tags=[_TAG],
    summary='Get dashboard statistics',
    description=(
        'Returns headline KPIs and trend data for the authenticated user\'s workspace.\n\n'
        '| Field | Description |\n'
        '|---|---|\n'
        '| `total_tenders` | All tenders pulled from source API |\n'
        '| `ai_qualified` | Pipeline items in qualified/active stages |\n'
        '| `in_progress` | Items the team is actively working on |\n'
        '| `submitted` | Bids already submitted |\n'
        '| `trend_data` | Daily new-tender counts over the requested window |\n\n'
        'Pair `trend_data` with the `days` parameter to power the 30-day vs 90-day '
        'chart toggle on the dashboard.'
    ),
    parameters=[
        OpenApiParameter(
            'days', OpenApiTypes.INT,
            description='Trend window in days (default 30, use 90 for the wider chart view)',
            required=False,
        )
    ],
    responses={200: _stats_response},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    workspace = get_workspace(request.user)

    total_tenders = Tender.objects.count()
    ai_qualified = AIReview.objects.filter(
        workspace=workspace,
        review_status=AIReview.ReviewStatus.COMPLETED,
        recommendation__in=[AIReview.Recommendation.PURSUE, AIReview.Recommendation.REVIEW],
    ).count() if workspace else 0
    in_progress = PipelineItem.objects.filter(
        workspace=workspace, stage=PipelineItem.Stage.IN_PROGRESS
    ).count() if workspace else 0
    submitted = PipelineItem.objects.filter(
        workspace=workspace, stage=PipelineItem.Stage.SUBMITTED
    ).count() if workspace else 0

    days = int(request.query_params.get('days', 30))
    since = timezone.now() - timedelta(days=days)
    trend_data = (
        Tender.objects.filter(created_at__gte=since)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    return Response({
        'total_tenders': total_tenders,
        'ai_qualified': ai_qualified,
        'in_progress': in_progress,
        'submitted': submitted,
        'trend_data': [{'date': str(d['date']), 'count': d['count']} for d in trend_data],
    })


@extend_schema(
    tags=[_TAG],
    summary='Get top recommended tenders',
    description=(
        'Returns the top-N tenders ordered by their workspace AI score (highest first). '
        'Falls back to newest tenders when no scores have been computed yet. '
        'Used to populate the "Top Recommended Tenders" section of the dashboard.'
    ),
    parameters=[
        OpenApiParameter(
            'limit', OpenApiTypes.INT,
            description='Maximum number of tenders to return (default 5)',
            required=False,
        )
    ],
    responses={200: TenderListSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_tenders(request):
    workspace = get_workspace(request.user)
    limit = int(request.query_params.get('limit', 5))

    if workspace:
        reviews = (
            AIReview.objects
            .filter(workspace=workspace, review_status=AIReview.ReviewStatus.COMPLETED)
            .select_related('tender')
            .order_by('-ai_score')[:limit]
        )
        tenders = [r.tender for r in reviews]
    else:
        tenders = list(Tender.objects.order_by('-created_at')[:limit])

    serializer = TenderListSerializer(tenders, many=True, context={'workspace': workspace, 'request': request})
    return Response(serializer.data)


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List activity feed',
        description=(
            'Returns up to 50 recent activity entries for the workspace, newest first. '
            'Each entry has a `type` (`ai` | `system` | `user` | `drafted`), a `prefix` '
            'sentence fragment and a `highlight` (bold part). '
            'Use both to render: `<span>{prefix}</span> <strong>{highlight}</strong>`.'
        ),
        responses={200: ActivitySerializer(many=True)},
    ),
)
class ActivityListView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Activity.objects.none()
        workspace = get_workspace(self.request.user)
        return Activity.objects.filter(workspace=workspace)[:50]
