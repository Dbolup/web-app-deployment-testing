from django.contrib import admin
from .models import Document, ExtractedSection


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'workspace', 'status', 'processing_progress', 'file_size', 'created_at']
    list_filter = ['status']
    search_fields = ['filename', 'workspace__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ExtractedSection)
class ExtractedSectionAdmin(admin.ModelAdmin):
    list_display = ['document', 'section_type', 'title', 'accuracy_score', 'ai_verified']
    list_filter = ['section_type', 'ai_verified']
