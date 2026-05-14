from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Workspace, TeamMember, Invitation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_staff', 'role']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'avatar', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'created_at')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'first_name', 'last_name', 'password1', 'password2')}),
    )
    readonly_fields = ['created_at', 'last_login']


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'ai_sensitivity', 'storage_used_percent', 'created_at']
    search_fields = ['name', 'owner__email']

    def storage_used_percent(self, obj):
        return f'{obj.storage_used_percent()}%'


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'workspace', 'role', 'status', 'invited_at']
    list_filter = ['role', 'status']
    search_fields = ['user__email', 'workspace__name']


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'workspace', 'role', 'accepted', 'expires_at']
    list_filter = ['accepted', 'role']
    search_fields = ['email', 'workspace__name']
