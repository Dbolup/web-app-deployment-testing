from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample,
    OpenApiResponse, inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers as drf_serializers

from .models import User, Workspace, TeamMember, Invitation
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    WorkspaceSerializer, TeamMemberSerializer, InvitationSerializer,
    PasswordChangeSerializer,
)
from .tasks import send_invite_email

_AUTH_TAG = 'Auth'

_token_response = inline_serializer(
    name='TokenResponse',
    fields={
        'access': drf_serializers.CharField(help_text='Short-lived JWT access token (default 60 min)'),
        'refresh': drf_serializers.CharField(help_text='Long-lived JWT refresh token (default 7 days)'),
        'user': UserSerializer(),
    },
)


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Register a new user',
    description=(
        'Creates a new user account and automatically provisions a personal workspace. '
        'Returns JWT access and refresh tokens so the client can immediately authenticate.'
    ),
    request=RegisterSerializer,
    responses={
        201: _token_response,
        400: OpenApiResponse(description='Validation errors (duplicate email, weak password, etc.)'),
    },
    examples=[
        OpenApiExample(
            'Minimal registration',
            value={
                'email': 'alex@example.com',
                'first_name': 'Alex',
                'last_name': 'Sterling',
                'password': 'securepass123',
                'workspace_name': 'Alluvium Procurement',
            },
            request_only=True,
        )
    ],
)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Log in',
    description=(
        'Authenticates with email and password. Returns a JWT access token and refresh token. '
        'Pass the access token as `Authorization: Bearer <token>` on subsequent requests.'
    ),
    request=LoginSerializer,
    responses={
        200: _token_response,
        400: OpenApiResponse(description='Invalid credentials or inactive account'),
    },
    examples=[
        OpenApiExample(
            'Login example',
            value={'email': 'alex@example.com', 'password': 'securepass123'},
            request_only=True,
        )
    ],
)
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


@extend_schema_view(
    get=extend_schema(
        tags=[_AUTH_TAG],
        summary='Get current user profile',
        description='Returns the profile of the authenticated user.',
        responses={200: UserSerializer},
    ),
    patch=extend_schema(
        tags=[_AUTH_TAG],
        summary='Update current user profile',
        description='Partially updates fields on the authenticated user (name, avatar, role).',
        request=UserSerializer,
        responses={200: UserSerializer},
    ),
    put=extend_schema(
        tags=[_AUTH_TAG],
        summary='Replace current user profile',
        request=UserSerializer,
        responses={200: UserSerializer},
    ),
)
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Change password',
    description='Updates the authenticated user\'s password. Requires the current password for verification.',
    request=PasswordChangeSerializer,
    responses={
        200: OpenApiResponse(description='`{"detail": "Password updated successfully"}`'),
        400: OpenApiResponse(description='Current password incorrect or new password too weak'),
    },
)
class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully'})


@extend_schema_view(
    get=extend_schema(
        tags=[_AUTH_TAG],
        summary='Get workspace settings',
        description=(
            'Returns settings for the workspace the authenticated user belongs to, including '
            'storage usage, AI sensitivity level, and saved keywords.'
        ),
        responses={200: WorkspaceSerializer},
    ),
    patch=extend_schema(
        tags=[_AUTH_TAG],
        summary='Update workspace settings',
        description=(
            'Partially updates workspace configuration. Writable fields: `name`, `ai_sensitivity` '
            '(`strict` | `balanced` | `broad`), `keywords` (list of strings).'
        ),
        request=WorkspaceSerializer,
        responses={200: WorkspaceSerializer},
    ),
    put=extend_schema(
        tags=[_AUTH_TAG],
        summary='Replace workspace settings',
        request=WorkspaceSerializer,
        responses={200: WorkspaceSerializer},
    ),
)
class WorkspaceView(generics.RetrieveUpdateAPIView):
    serializer_class = WorkspaceSerializer

    def get_object(self):
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            from rest_framework.exceptions import NotFound
            raise NotFound('No workspace found')
        return membership.workspace


@extend_schema_view(
    get=extend_schema(
        tags=[_AUTH_TAG],
        summary='List team members',
        description='Returns all members of the authenticated user\'s workspace.',
        responses={200: TeamMemberSerializer(many=True)},
    ),
    post=extend_schema(
        tags=[_AUTH_TAG],
        summary='Add team member',
        description='Adds an existing user to the workspace with a specified role.',
        request=TeamMemberSerializer,
        responses={201: TeamMemberSerializer},
    ),
)
class TeamMemberListView(generics.ListCreateAPIView):
    serializer_class = TeamMemberSerializer
    queryset = TeamMember.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return TeamMember.objects.none()
        workspace = self._get_workspace()
        return workspace.members.select_related('user').all()

    def _get_workspace(self):
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            from rest_framework.exceptions import NotFound
            raise NotFound('No workspace found')
        return membership.workspace

    def perform_create(self, serializer):
        serializer.save(workspace=self._get_workspace())


@extend_schema_view(
    get=extend_schema(
        tags=[_AUTH_TAG],
        summary='Get team member',
        responses={200: TeamMemberSerializer},
    ),
    patch=extend_schema(
        tags=[_AUTH_TAG],
        summary='Update team member role/status',
        description='Change a member\'s `role` (`super_admin` | `reviewer` | `editor`) or `status` (`active` | `pending`).',
        request=TeamMemberSerializer,
        responses={200: TeamMemberSerializer},
    ),
    put=extend_schema(
        tags=[_AUTH_TAG],
        summary='Replace team member',
        request=TeamMemberSerializer,
        responses={200: TeamMemberSerializer},
    ),
    delete=extend_schema(
        tags=[_AUTH_TAG],
        summary='Remove team member',
        description='Removes the member from the workspace. Does not delete the user account.',
        responses={204: OpenApiResponse(description='Member removed')},
    ),
)
class TeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            return TeamMember.objects.none()
        return membership.workspace.members.all()


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Send workspace invitation',
    description=(
        'Creates an invitation for the given email address and assigns them a role on acceptance. '
        'The invitation is valid for 7 days. In production, send `token` via email to the invitee.'
    ),
    request=InvitationSerializer,
    responses={
        201: InvitationSerializer,
        400: OpenApiResponse(description='Validation error'),
    },
    examples=[
        OpenApiExample(
            'Invite a reviewer',
            value={'email': 'reviewer@example.com', 'role': 'reviewer'},
            request_only=True,
        )
    ],
)
class InvitationView(generics.CreateAPIView):
    serializer_class = InvitationSerializer

    def _get_workspace(self):
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            from rest_framework.exceptions import NotFound
            raise NotFound('No workspace found')
        return membership.workspace

    def perform_create(self, serializer):
        workspace = self._get_workspace()
        invitation = serializer.save(workspace=workspace)
        invited_by = self.request.user.get_full_name() or self.request.user.email
        send_invite_email.enqueue(
            email=invitation.email,
            workspace_name=workspace.name,
            role=invitation.role,
            token=str(invitation.token),
            invited_by=invited_by,
        )


_detail_serializer = inline_serializer(
    name='DetailMessage', fields={'detail': drf_serializers.CharField()}
)


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Accept workspace invitation',
    description=(
        'Accepts a pending invitation by its UUID token. The authenticated user is added to the '
        'workspace with the role specified in the invitation. Returns 400 if the token is invalid '
        'or the invitation has expired.'
    ),
    parameters=[
        OpenApiParameter(
            name='token',
            location=OpenApiParameter.PATH,
            type=OpenApiTypes.UUID,
            description='Invitation token (UUID) sent to the invitee',
        )
    ],
    request=None,
    responses={
        200: _detail_serializer,
        400: OpenApiResponse(description='Invalid token or invitation expired'),
        401: OpenApiResponse(description='Authentication required'),
    },
)
class AcceptInvitationView(generics.GenericAPIView):
    serializer_class = InvitationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Invitation.objects.none()

    def _get_valid_invitation(self, token):
        try:
            invitation = Invitation.objects.select_related('workspace').get(token=token, accepted=False)
        except Invitation.DoesNotExist:
            return None, Response({'detail': 'Invalid or expired invitation'}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.expires_at < timezone.now():
            return None, Response({'detail': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        return invitation, None

    def get(self, request, token):
        invitation, err = self._get_valid_invitation(token)
        if err:
            return err
        return Response({
            'workspace_name': invitation.workspace.name,
            'role': invitation.role,
            'email': invitation.email,
        })

    def post(self, request, token):
        invitation, err = self._get_valid_invitation(token)
        if err:
            return err

        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required to accept invitation'}, status=status.HTTP_401_UNAUTHORIZED)

        TeamMember.objects.get_or_create(
            workspace=invitation.workspace,
            user=request.user,
            defaults={'role': invitation.role, 'status': TeamMember.Status.ACTIVE},
        )
        invitation.accepted = True
        invitation.save()
        return Response({'detail': 'Invitation accepted'})


@extend_schema(
    tags=[_AUTH_TAG],
    summary='List pending invitations',
    description='Returns all non-accepted, non-expired invitations for the workspace.',
    responses={200: InvitationSerializer(many=True)},
)
class PendingInvitationsView(generics.ListAPIView):
    serializer_class = InvitationSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Invitation.objects.none()
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            return Invitation.objects.none()
        return Invitation.objects.filter(
            workspace=membership.workspace,
            accepted=False,
            expires_at__gt=timezone.now(),
        ).order_by('-created_at')


@extend_schema(
    tags=[_AUTH_TAG],
    summary='Cancel invitation',
    description='Deletes a pending invitation so the link can no longer be used.',
    responses={204: OpenApiResponse(description='Invitation cancelled')},
)
class InvitationDetailView(generics.DestroyAPIView):
    serializer_class = InvitationSerializer

    def get_queryset(self):
        membership = self.request.user.team_memberships.filter(status=TeamMember.Status.ACTIVE).first()
        if not membership:
            return Invitation.objects.none()
        return Invitation.objects.filter(workspace=membership.workspace, accepted=False)
