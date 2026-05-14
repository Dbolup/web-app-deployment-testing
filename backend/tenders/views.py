from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters as df
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample,
    OpenApiResponse, inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

from accounts.models import TeamMember
from .models import Tender, TenderScore, FetchLog
from .serializers import (
    TenderListSerializer, TenderDetailSerializer,
    TenderScoreUpdateSerializer, TenderScoreSerializer, FetchLogSerializer,
)
from .services.find_tender import FindTenderService

_TAG = 'Tenders'


def get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


class TenderFilter(FilterSet):
    industry = df.CharFilter(lookup_expr='icontains')
    location = df.CharFilter(lookup_expr='icontains')
    organization = df.CharFilter(lookup_expr='icontains')
    deadline_after = df.DateTimeFilter(field_name='deadline', lookup_expr='gte')
    deadline_before = df.DateTimeFilter(field_name='deadline', lookup_expr='lte')
    budget_min = df.NumberFilter(field_name='budget_min', lookup_expr='gte')
    budget_max = df.NumberFilter(field_name='budget_max', lookup_expr='lte')

    class Meta:
        model = Tender
        fields = ['industry', 'location', 'organization', 'notice_type']


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List tenders',
        description=(
            'Returns a paginated list of all tenders pulled from find-tender.service.gov.uk. '
            'Supports full-text search and filtering by industry, location, budget, deadline, '
            'organisation and notice type. Each tender includes the workspace-specific AI score '
            'when available.\n\n'
            '**Ordering**: prefix field name with `-` for descending, e.g. `-deadline`.'
        ),
        parameters=[
            OpenApiParameter('search', OpenApiTypes.STR, description='Free-text search across title, organisation, description and reference ID'),
            OpenApiParameter('industry', OpenApiTypes.STR, description='Filter by industry (partial match)'),
            OpenApiParameter('location', OpenApiTypes.STR, description='Filter by delivery location (partial match)'),
            OpenApiParameter('organization', OpenApiTypes.STR, description='Filter by contracting organisation name (partial match)'),
            OpenApiParameter('notice_type', OpenApiTypes.STR, description='Filter by OCDS notice tag, e.g. `tender`, `award`'),
            OpenApiParameter('deadline_after', OpenApiTypes.DATETIME, description='Only tenders with deadline on or after this date (ISO 8601)'),
            OpenApiParameter('deadline_before', OpenApiTypes.DATETIME, description='Only tenders with deadline on or before this date (ISO 8601)'),
            OpenApiParameter('budget_min', OpenApiTypes.FLOAT, description='Minimum budget_min value (£)'),
            OpenApiParameter('budget_max', OpenApiTypes.FLOAT, description='Maximum budget_max value (£)'),
            OpenApiParameter('ordering', OpenApiTypes.STR, description='Sort field: `deadline`, `-deadline`, `published_date`, `-published_date`, `budget_min`, `budget_max`'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number (default 1)'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Results per page (default 20, max 100)'),
        ],
        responses={200: TenderListSerializer(many=True)},
    ),
)
class TenderListView(generics.ListAPIView):
    serializer_class = TenderListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TenderFilter
    search_fields = ['title', 'organization', 'department', 'description', 'ref_id']
    ordering_fields = ['deadline', 'published_date', 'budget_min', 'budget_max']
    ordering = ['-published_date']

    def get_queryset(self):
        return Tender.objects.all()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['workspace'] = get_workspace(self.request.user)
        return ctx


@extend_schema(
    tags=[_TAG],
    summary='Get tender detail',
    description=(
        'Returns the full detail for a single tender identified by its OCDS reference ID '
        '(e.g. `ocds-h6vhtk-000001`). Includes scope, deliverables, evaluation criteria, '
        'timeline and the workspace AI score if available.'
    ),
    parameters=[
        OpenApiParameter(
            'ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
            description='OCDS reference ID of the tender (e.g. `ocds-h6vhtk-000001`)',
        )
    ],
    responses={
        200: TenderDetailSerializer,
        404: OpenApiResponse(description='Tender not found'),
    },
)
class TenderDetailView(generics.RetrieveAPIView):
    serializer_class = TenderDetailSerializer
    queryset = Tender.objects.all()
    lookup_field = 'ref_id'

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['workspace'] = get_workspace(self.request.user)
        return ctx


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get AI score for a tender',
        description=(
            'Returns the workspace-specific AI score, feasibility score, risk level, '
            'capability alignment checklist and executive summary for the given tender. '
            'A score record is created with defaults if it does not yet exist.'
        ),
        parameters=[
            OpenApiParameter('ref_id', OpenApiTypes.STR, OpenApiParameter.PATH,
                             description='OCDS reference ID of the tender'),
        ],
        responses={200: TenderScoreSerializer},
    ),
    put=extend_schema(
        tags=[_TAG],
        summary='Update AI score for a tender',
        description=(
            'Updates the workspace-specific score record for a tender. All fields are optional '
            '(PATCH semantics applied).\n\n'
            '| Field | Type | Description |\n'
            '|---|---|---|\n'
            '| `ai_score` | int 0–100 | Overall AI match score |\n'
            '| `status` | enum | `new` \\| `selected` \\| `reviewed` |\n'
            '| `feasibility_score` | int 0–100 | Delivery feasibility |\n'
            '| `risk_level` | enum | `low` \\| `medium` \\| `high` |\n'
            '| `capability_alignment` | list | Array of capability objects `{label, met}` |\n'
            '| `executive_summary` | string | Freeform summary text |\n'
        ),
        request=TenderScoreUpdateSerializer,
        responses={200: TenderScoreSerializer},
        examples=[
            OpenApiExample(
                'Mark as reviewed with full score',
                value={
                    'ai_score': 87,
                    'status': 'reviewed',
                    'feasibility_score': 72,
                    'risk_level': 'low',
                    'capability_alignment': [
                        {'label': 'Cloud Migration', 'met': True},
                        {'label': 'Security Clearance Level 4', 'met': False},
                    ],
                    'executive_summary': 'Strong match for our cloud migration practice.',
                },
                request_only=True,
            )
        ],
    ),
    patch=extend_schema(
        tags=[_TAG],
        summary='Partially update AI score',
        description='Same as PUT but only the supplied fields are updated.',
        request=TenderScoreUpdateSerializer,
        responses={200: TenderScoreSerializer},
    ),
)
class TenderScoreView(generics.RetrieveUpdateAPIView):
    serializer_class = TenderScoreSerializer

    def get_object(self):
        tender = generics.get_object_or_404(Tender, ref_id=self.kwargs['ref_id'])
        workspace = get_workspace(self.request.user)
        score, _ = TenderScore.objects.get_or_create(tender=tender, workspace=workspace)
        return score

    def update(self, request, *args, **kwargs):
        score = self.get_object()
        serializer = TenderScoreUpdateSerializer(score, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TenderScoreSerializer(score).data)


_fetch_request = inline_serializer(
    name='FetchTendersRequest',
    fields={
        'keywords': drf_serializers.ListField(
            child=drf_serializers.CharField(),
            required=False,
            help_text=(
                'Client-side keyword filter applied to title + description after fetching. '
                'The FTS API has no server-side search — this filters the fetched batch. '
                'Falls back to workspace keywords when omitted.'
            ),
        ),
        'days_back': drf_serializers.IntegerField(
            required=False,
            default=30,
            help_text='Fetch notices updated within this many days (passed as updatedFrom). Default 30.',
        ),
    },
)


@extend_schema(
    tags=[_TAG],
    summary='Fetch tenders from find-tender.service.gov.uk',
    description=(
        'Triggers a live query against the UK Find a Tender Service OCDS API '
        '(`find-tender.service.gov.uk/api/1.0/ocdsReleasePackages`). '
        'New tenders are inserted; existing ones are updated. '
        'Returns a fetch log with counts and any errors.\n\n'
        '- If `keywords` is omitted the workspace\'s saved keywords are used.\n'
        '- This can take a few seconds depending on result size.'
    ),
    request=_fetch_request,
    responses={
        200: FetchLogSerializer,
        502: OpenApiResponse(description='Upstream find-tender.service.gov.uk API error'),
    },
    examples=[
        OpenApiExample(
            'Fetch cloud-related tenders',
            value={'keywords': ['cloud migration', 'infrastructure', 'AWS']},
            request_only=True,
        )
    ],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_tenders(request):
    keywords = request.data.get('keywords', [])
    days_back = int(request.data.get('days_back', 30))
    workspace = get_workspace(request.user)
    if workspace and workspace.keywords:
        keywords = keywords or workspace.keywords

    service = FindTenderService()
    log = service.fetch_and_store(keywords=keywords, days_back=days_back)
    return Response(FetchLogSerializer(log).data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List fetch logs',
        description='Returns the 20 most recent fetch log entries showing when tenders were last pulled from the source API.',
        responses={200: FetchLogSerializer(many=True)},
    ),
)
class FetchLogListView(generics.ListAPIView):
    serializer_class = FetchLogSerializer
    queryset = FetchLog.objects.all()[:20]
