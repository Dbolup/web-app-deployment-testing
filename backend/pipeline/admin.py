from django.contrib import admin
from .models import PipelineItem, StageHistory


@admin.register(PipelineItem)
class PipelineItemAdmin(admin.ModelAdmin):
    list_display = ['tender', 'workspace', 'stage', 'assigned_to', 'created_at']
    list_filter = ['stage']
    search_fields = ['tender__ref_id', 'tender__title', 'workspace__name']


@admin.register(StageHistory)
class StageHistoryAdmin(admin.ModelAdmin):
    list_display = ['pipeline_item', 'from_stage', 'to_stage', 'changed_by', 'changed_at']
    readonly_fields = ['changed_at']
