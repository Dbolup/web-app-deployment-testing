from django.contrib import admin
from .models import Tender, TenderScore, FetchLog


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ['ref_id', 'title', 'organization', 'budget_display', 'deadline', 'published_date']
    list_filter = ['industry', 'notice_type']
    search_fields = ['ref_id', 'title', 'organization', 'department']
    readonly_fields = ['created_at', 'updated_at', 'raw_data']
    ordering = ['-published_date']


@admin.register(TenderScore)
class TenderScoreAdmin(admin.ModelAdmin):
    list_display = ['tender', 'workspace', 'ai_score', 'status', 'risk_level', 'feasibility_score']
    list_filter = ['status', 'risk_level']
    search_fields = ['tender__ref_id', 'tender__title', 'workspace__name']


@admin.register(FetchLog)
class FetchLogAdmin(admin.ModelAdmin):
    list_display = ['fetched_at', 'status', 'tenders_found', 'tenders_new', 'tenders_updated']
    list_filter = ['status']
    readonly_fields = ['fetched_at']
