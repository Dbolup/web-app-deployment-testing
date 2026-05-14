from django.contrib import admin
from .models import Integration


@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ['name', 'workspace', 'integration_type', 'status', 'last_sync']
    list_filter = ['integration_type', 'status']
    search_fields = ['name', 'workspace__name']
