from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample,
    OpenApiResponse,
)
from drf_spectacular.types import OpenApiTypes

from accounts.models import TeamMember
from .models import Document, ExtractedSection
from .serializers import DocumentSerializer, DocumentUploadSerializer, ExtractedSectionSerializer

_TAG = 'Documents'


def get_workspace(user):
    membership = user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
    return membership.workspace if membership else None


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List uploaded documents',
        description=(
            'Returns all documents uploaded to the workspace, including their processing status '
            'and any extracted sections. Ordered newest first.'
        ),
        responses={200: DocumentSerializer(many=True)},
    ),
)
class DocumentListView(generics.ListAPIView):
    serializer_class = DocumentSerializer
    queryset = Document.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Document.objects.none()
        workspace = get_workspace(self.request.user)
        return Document.objects.filter(workspace=workspace).prefetch_related('sections')


@extend_schema(
    tags=[_TAG],
    summary='Upload a document',
    description=(
        'Uploads a tender-related document (PDF, DOCX, etc.) to the workspace. '
        'The response includes the document ID and initial `uploaded` status. '
        'Call `POST /documents/{id}/process/` to trigger AI extraction.\n\n'
        'The file size is added to the workspace storage usage counter.'
    ),
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {'type': 'string', 'format': 'binary', 'description': 'The document file'},
                'tender': {'type': 'integer', 'description': 'Optional tender ID to link this document to'},
            },
            'required': ['file'],
        }
    },
    responses={
        201: DocumentSerializer,
        400: OpenApiResponse(description='No file provided or file type not accepted'),
    },
)
class DocumentUploadView(generics.CreateAPIView):
    serializer_class = DocumentUploadSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        workspace = get_workspace(self.request.user)
        doc = serializer.save(workspace=workspace, uploaded_by=self.request.user)
        workspace.storage_used += doc.file_size
        workspace.save(update_fields=['storage_used'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        doc = Document.objects.get(pk=serializer.instance.pk)
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='Get document detail',
        description='Returns a document with all its extracted sections.',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses={200: DocumentSerializer, 404: OpenApiResponse(description='Not found')},
    ),
    delete=extend_schema(
        tags=[_TAG],
        summary='Delete document',
        description='Deletes the document and its file. Reduces the workspace storage counter accordingly.',
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description='Deleted')},
    ),
)
class DocumentDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        workspace = get_workspace(self.request.user)
        return Document.objects.filter(workspace=workspace)

    def perform_destroy(self, instance):
        workspace = get_workspace(self.request.user)
        workspace.storage_used = max(0, workspace.storage_used - instance.file_size)
        workspace.save(update_fields=['storage_used'])
        instance.file.delete(save=False)
        instance.delete()


@extend_schema(
    tags=[_TAG],
    summary='Start AI processing',
    description=(
        'Marks a document as `processing` so the AI extraction pipeline can pick it up. '
        'Only documents in `uploaded` or `failed` status can be (re-)processed.\n\n'
        'Once processing completes the status transitions to `processed` and the '
        'extracted sections become available at `GET /documents/{id}/sections/`.'
    ),
    parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH, description='Document ID')],
    request=None,
    responses={
        200: DocumentSerializer,
        400: OpenApiResponse(description='Document is already processing or processed'),
        404: OpenApiResponse(description='Not found'),
    },
)
class StartProcessingView(generics.GenericAPIView):
    serializer_class = DocumentSerializer
    queryset = Document.objects.none()

    def post(self, request, pk):
        workspace = get_workspace(request.user)
        doc = generics.get_object_or_404(Document, pk=pk, workspace=workspace)

        if doc.status not in [Document.Status.UPLOADED, Document.Status.FAILED]:
            return Response(
                {'detail': f'Document is already {doc.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc.status = Document.Status.PROCESSING
        doc.processing_progress = 0
        doc.save(update_fields=['status', 'processing_progress'])

        return Response(DocumentSerializer(doc).data)


@extend_schema_view(
    get=extend_schema(
        tags=[_TAG],
        summary='List extracted sections',
        description=(
            'Returns the AI-extracted sections for a processed document.\n\n'
            '**Section types**: `scope_of_work`, `deliverables`, `evaluation_criteria`, '
            '`timeline`, `requirements`, `other`\n\n'
            'Each section has an `accuracy_score` (0.0–1.0) and an `ai_verified` flag.'
        ),
        parameters=[OpenApiParameter('id', OpenApiTypes.INT, OpenApiParameter.PATH, description='Document ID')],
        responses={
            200: ExtractedSectionSerializer(many=True),
            404: OpenApiResponse(description='Document not found'),
        },
    ),
)
class DocumentSectionsView(generics.ListAPIView):
    serializer_class = ExtractedSectionSerializer
    queryset = ExtractedSection.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ExtractedSection.objects.none()
        workspace = get_workspace(self.request.user)
        doc = generics.get_object_or_404(Document, pk=self.kwargs['pk'], workspace=workspace)
        return doc.sections.all()
