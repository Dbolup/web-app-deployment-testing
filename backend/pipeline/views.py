from rest_framework import generics, status, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample,
    OpenApiResponse, inline_serializer,
)
from drf_spectacular.types import OpenApiTypes

from accounts.models import TeamMember
from tenders.models import Tender
from ai_review.models import AIReview
from .models import PipelineItem, StageHistory
from .serializers import PipelineItemSerializer, PipelineItemMoveSerializer, PipelineKanbanSerializer
from .tasks import send_tender_review_email

_TAG = 'Pipeline'


def get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List pipeline items',
        description=(
            'Returns all items in the workspace pipeline. Use the `stage` query parameter '
            'to filter by a single Kanban column.\n\n'
            '**Stages**: `new` | `ai_qualified` | `under_review` | `in_progress` | '
            '`blocked` | `submitted` | `on_hold` | `viable`'
        ),
        parameters=[
            OpenApiParameter(
                'stage', OpenApiTypes.STR,
                description='Filter to a single stage. One of: `new`, `ai_qualified`, `under_review`, `in_progress`, `blocked`, `submitted`, `on_hold`, `viable`',
                enum=[s[0] for s in PipelineItem.Stage.choices],
                required=False,
            )
        ],
        responses={200: PipelineItemSerializer(many=True)},
    ),
    post=extend_schema(
        tags=[_TAG],
        summary='Add tender to pipeline',
        description=(
            'Adds a tender to the workspace pipeline and records the initial stage in the '
            'stage history. Raises 400 if the tender is already in the pipeline for this workspace.'
        ),
        request=PipelineItemSerializer,
        responses={
            201: PipelineItemSerializer,
            400: OpenApiResponse(description='Tender already in pipeline or validation error'),
        },
        examples=[
            OpenApiExample(
                'Add to AI Qualified stage',
                value={'tender_id': 42, 'stage': 'ai_qualified', 'notes': 'Strong CPV match'},
                request_only=True,
            )
        ],
    ),
)
class PipelineItemListView(generics.ListCreateAPIView):
    serializer_class = PipelineItemSerializer
    queryset = PipelineItem.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return PipelineItem.objects.none()
        workspace = get_workspace(self.request.user)
        qs = PipelineItem.objects.filter(workspace=workspace).select_related('tender', 'assigned_to')
        stage = self.request.query_params.get('stage')
        if stage:
            qs = qs.filter(stage=stage)
        return qs

    def perform_create(self, serializer):
        workspace = get_workspace(self.request.user)
        item = serializer.save(workspace=workspace)
        StageHistory.objects.create(
            pipeline_item=item,
            from_stage='',
            to_stage=item.stage,
            changed_by=self.request.user,
        )


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get pipeline item',
        description='Returns a single pipeline item including the full stage-change history.',
        responses={200: PipelineItemSerializer},
    ),
    patch=extend_schema(
        tags=[_TAG],
        summary='Update pipeline item',
        description='Updates `notes` or `assigned_to_id`. To change stage use the `/move/` endpoint so history is recorded.',
        request=PipelineItemSerializer,
        responses={200: PipelineItemSerializer},
    ),
    put=extend_schema(
        tags=[_TAG],
        summary='Replace pipeline item',
        request=PipelineItemSerializer,
        responses={200: PipelineItemSerializer},
    ),
    delete=extend_schema(
        tags=[_TAG],
        summary='Remove tender from pipeline',
        description='Removes the item from the pipeline. The underlying tender record is not deleted.',
        responses={204: OpenApiResponse(description='Removed')},
    ),
)
class PipelineItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PipelineItemSerializer

    def get_queryset(self):
        workspace = get_workspace(self.request.user)
        return PipelineItem.objects.filter(workspace=workspace)


@extend_schema(
    tags=[_TAG],
    summary='Move item to a different stage',
    description=(
        'Moves a pipeline item to a new Kanban stage and records the transition in the '
        'stage history. An optional `note` can describe why the move was made.\n\n'
        '**Valid stages**: `new` | `ai_qualified` | `under_review` | `in_progress` | '
        '`blocked` | `submitted` | `on_hold` | `viable`'
    ),
    parameters=[
        OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH, description='Pipeline item ID')
    ],
    request=PipelineItemMoveSerializer,
    responses={
        200: PipelineItemSerializer,
        400: OpenApiResponse(description='Invalid stage value'),
        404: OpenApiResponse(description='Pipeline item not found in this workspace'),
    },
    examples=[
        OpenApiExample(
            'Move to In Progress',
            value={'stage': 'in_progress', 'note': 'Bid team confirmed capacity'},
            request_only=True,
        ),
        OpenApiExample(
            'Mark as Submitted',
            value={'stage': 'submitted', 'note': 'Submitted via portal on 2026-05-13'},
            request_only=True,
        ),
    ],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def move_pipeline_item(request, pk):
    workspace = get_workspace(request.user)
    item = generics.get_object_or_404(PipelineItem, pk=pk, workspace=workspace)

    serializer = PipelineItemMoveSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    old_stage = item.stage
    new_stage = serializer.validated_data['stage']
    note = serializer.validated_data.get('note', '')

    item.stage = new_stage
    item.save()

    StageHistory.objects.create(
        pipeline_item=item,
        from_stage=old_stage,
        to_stage=new_stage,
        changed_by=request.user,
        note=note,
    )

    return Response(PipelineItemSerializer(item).data)


@extend_schema(
    tags=[_TAG],
    summary='Get full Kanban board',
    description=(
        'Returns all 8 pipeline stages in order, each containing its items. '
        'This is the primary endpoint for rendering the Kanban view — '
        'a single call replaces N individual stage queries.\n\n'
        'Response shape:\n'
        '```json\n'
        '[\n'
        '  { "stage": "new", "label": "New Tenders", "count": 5, "items": [...] },\n'
        '  { "stage": "ai_qualified", "label": "AI Qualified", "count": 2, "items": [...] },\n'
        '  ...\n'
        ']\n'
        '```'
    ),
    responses={200: PipelineKanbanSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pipeline_kanban(request):
    workspace = get_workspace(request.user)
    items = PipelineItem.objects.filter(workspace=workspace).select_related(
        'tender', 'assigned_to'
    ).prefetch_related('stage_history')

    result = []
    for stage, label in PipelineItem.Stage.choices:
        stage_items = [i for i in items if i.stage == stage]
        result.append({
            'stage': stage,
            'label': label,
            'count': len(stage_items),
            'items': PipelineItemSerializer(stage_items, many=True).data,
        })

    return Response(result)


@extend_schema(
    tags=[_TAG],
    summary='Send tender review by email',
    description='Enqueues a background task to email the AI review for a tender to one or more recipients. Returns immediately.',
    request=inline_serializer(
        name='SendReviewEmailRequest',
        fields={
            'ref_id': drf_serializers.CharField(),
            'emails': drf_serializers.ListField(child=drf_serializers.EmailField()),
        },
    ),
    responses={202: inline_serializer(name='SendReviewEmailResponse', fields={'queued': drf_serializers.BooleanField()})},
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_review_email(request):
    workspace = get_workspace(request.user)
    ref_id = request.data.get('ref_id', '').strip()
    emails = request.data.get('emails', [])

    if not ref_id:
        return Response({'error': 'ref_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not emails:
        return Response({'error': 'At least one email address is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not workspace:
        return Response({'error': 'No active workspace'}, status=status.HTTP_403_FORBIDDEN)

    # Validate the tender and review exist before queuing
    tender = generics.get_object_or_404(Tender, ref_id=ref_id)
    has_review = AIReview.objects.filter(
        workspace=workspace, tender=tender, review_status=AIReview.ReviewStatus.COMPLETED
    ).exists()
    if not has_review:
        return Response({'error': 'No completed AI review found for this tender'}, status=status.HTTP_404_NOT_FOUND)

    sender_name = request.user.get_full_name() or request.user.email
    send_tender_review_email.enqueue(
        ref_id=ref_id,
        workspace_id=workspace.id,
        emails=list(emails),
        sender_name=sender_name,
    )

    return Response({'queued': True}, status=status.HTTP_202_ACCEPTED)
