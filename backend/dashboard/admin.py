from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['activity_type', 'prefix', 'highlight', 'workspace', 'user', 'created_at']
    list_filter = ['activity_type']
    readonly_fields = ['created_at']
