from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema_field
from .models import User, Workspace, TeamMember, Invitation


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'avatar', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return obj.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    workspace_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'workspace_name']

    def create(self, validated_data):
        workspace_name = validated_data.pop('workspace_name', None)
        user = User.objects.create_user(**validated_data)
        name = workspace_name or f"{user.first_name}'s Workspace"
        workspace, created = Workspace.objects.get_or_create(name=name, owner=user)
        TeamMember.objects.create(
            workspace=workspace, user=user, role=TeamMember.Role.SUPER_ADMIN, status=TeamMember.Status.ACTIVE
        )
        return user


class AcceptInvitationAccountSerializer(serializers.Serializer):
    """Sets up the account for an invitee who has no existing user yet."""
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True, min_length=8)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')
        data['user'] = user
        return data


class WorkspaceSerializer(serializers.ModelSerializer):
    storage_used_percent = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'storage_used', 'storage_limit', 'storage_used_percent',
            'ai_sensitivity', 'keywords', 'member_count', 'created_at',
        ]
        read_only_fields = ['id', 'storage_used', 'created_at']

    @extend_schema_field(serializers.FloatField())
    def get_storage_used_percent(self, obj):
        return obj.storage_used_percent()

    @extend_schema_field(serializers.IntegerField())
    def get_member_count(self, obj):
        return obj.members.count()


class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_id', 'role', 'status', 'invited_at']
        read_only_fields = ['id', 'invited_at']


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['id', 'email', 'role', 'token', 'created_at', 'expires_at', 'accepted']
        read_only_fields = ['id', 'token', 'created_at', 'expires_at', 'accepted']

    def create(self, validated_data):
        validated_data['expires_at'] = timezone.now() + timezone.timedelta(days=7)
        return super().create(validated_data)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value
