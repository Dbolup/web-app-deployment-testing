from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers as drf_serializers
from . import views


@extend_schema(
    tags=['Auth'],
    summary='Refresh access token',
    description=(
        'Exchange a valid refresh token for a new access token. '
        'The refresh token is rotated — a new one is returned alongside the new access token.'
    ),
    request=inline_serializer(
        name='TokenRefreshRequest',
        fields={'refresh': drf_serializers.CharField(help_text='The current refresh token')},
    ),
    responses={
        200: inline_serializer(
            name='TokenRefreshResponse',
            fields={
                'access': drf_serializers.CharField(help_text='New access token'),
                'refresh': drf_serializers.CharField(help_text='New refresh token'),
            },
        ),
        401: OpenApiResponse(description='Refresh token invalid or expired'),
    },
)
class AnnotatedTokenRefreshView(TokenRefreshView):
    pass


urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', AnnotatedTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    path('workspace/', views.WorkspaceView.as_view(), name='workspace'),
    path('team/', views.TeamMemberListView.as_view(), name='team_list'),
    path('team/<int:pk>/', views.TeamMemberDetailView.as_view(), name='team_detail'),
    path('invite/', views.InvitationView.as_view(), name='invite'),
    path('invite/accept/<uuid:token>/', views.AcceptInvitationView.as_view(), name='accept_invitation'),
]
