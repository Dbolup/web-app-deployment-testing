from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

from accounts.models import TeamMember
from .models import Integration
from .serializers import IntegrationSerializer, IntegrationConfigSerializer

_TAG = 'Integrations'


def get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List integrations',
        description=(
            'Returns all integrations configured for the workspace (connected or not). '
            'The `config` field (which may contain API keys) is **not** included in list responses — '
            'use `GET /integrations/{id}/` to retrieve it.'
        ),
        responses={200: IntegrationSerializer(many=True)},
    ),
    post=extend_schema(
        tags=[_TAG],
        summary='Create integration',
        description=(
            'Registers a new integration for the workspace.\n\n'
            '**Integration types**: `gov_tender` | `confluence` | `slack` | `teams` | `other`\n\n'
            'After creation, update the `config` field via `PATCH /integrations/{id}/` '
            'with the API key or OAuth credentials for that service.'
        ),
        request=IntegrationSerializer,
        responses={201: IntegrationSerializer},
        examples=[
            OpenApiExample(
                'Add Confluence',
                value={'name': 'Confluence Wiki', 'integration_type': 'confluence', 'status': 'disconnected'},
                request_only=True,
            )
        ],
    ),
)
class IntegrationListView(generics.ListCreateAPIView):
    serializer_class = IntegrationSerializer
    queryset = Integration.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Integration.objects.none()
        workspace = get_workspace(self.request.user)
        return Integration.objects.filter(workspace=workspace)

    def perform_create(self, serializer):
        serializer.save(workspace=get_workspace(self.request.user))


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get integration detail',
        description='Returns the integration including its `config` object (API keys, tokens, etc.).',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses={200: IntegrationConfigSerializer},
    ),
    patch=extend_schema(
        tags=[_TAG],
        summary='Update integration',
        description=(
            'Updates an integration. Use this to set or rotate API credentials in `config`, '
            'or to change the `status` to `connected` once credentials are saved.\n\n'
            '**Note**: `config` is stored in plaintext in the DB — use an encrypted field or '
            'secrets manager in production.'
        ),
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        request=IntegrationConfigSerializer,
        responses={200: IntegrationConfigSerializer},
        examples=[
            OpenApiExample(
                'Connect Confluence with API token',
                value={
                    'status': 'connected',
                    'config': {
                        'base_url': 'https://myorg.atlassian.net',
                        'api_token': 'ATATT3xFf...',
                        'email': 'bot@myorg.com',
                    },
                },
                request_only=True,
            )
        ],
    ),
    put=extend_schema(
        tags=[_TAG],
        summary='Replace integration',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        request=IntegrationConfigSerializer,
        responses={200: IntegrationConfigSerializer},
    ),
    delete=extend_schema(
        tags=[_TAG],
        summary='Delete integration',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description='Deleted')},
    ),
)
class IntegrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IntegrationConfigSerializer

    def get_queryset(self):
        workspace = get_workspace(self.request.user)
        return Integration.objects.filter(workspace=workspace)


@extend_schema(
    tags=[_TAG],
    summary='Disconnect integration',
    description=(
        'Sets the integration status to `disconnected` and clears its `config` (removes stored '
        'credentials). The integration record itself is kept so it can be reconnected later.'
    ),
    parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
    request=None,
    responses={
        200: IntegrationSerializer,
        404: OpenApiResponse(description='Integration not found'),
    },
)
class DisconnectIntegrationView(generics.GenericAPIView):
    serializer_class = IntegrationSerializer
    queryset = Integration.objects.none()

    def post(self, request, pk):
        workspace = get_workspace(request.user)
        integration = generics.get_object_or_404(Integration, pk=pk, workspace=workspace)
        integration.status = Integration.Status.DISCONNECTED
        integration.config = {}
        integration.save()
        return Response(IntegrationSerializer(integration).data)


@extend_schema(
    tags=[_TAG],
    summary='Get all integration statuses',
    description=(
        'Convenience endpoint that returns the name and connection status of every '
        'integration in the workspace without the `config` field. '
        'Suitable for rendering the integrations panel in Settings.'
    ),
    responses={200: IntegrationSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def integration_status(request):
    workspace = get_workspace(request.user)
    integrations = Integration.objects.filter(workspace=workspace)
    return Response(IntegrationSerializer(integrations, many=True).data)
