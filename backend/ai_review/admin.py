from django.contrib import admin
from .models import CompanyProfile, AIReview, HumanFeedback


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'workspace', 'onboarding_completed', 'updated_at']
    list_filter = ['onboarding_completed']
    search_fields = ['company_name']


@admin.register(AIReview)
class AIReviewAdmin(admin.ModelAdmin):
    list_display = ['tender', 'workspace', 'ai_score', 'recommendation', 'review_status', 'updated_at']
    list_filter = ['review_status', 'recommendation', 'risk_level']
    search_fields = ['tender__ref_id', 'tender__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(HumanFeedback)
class HumanFeedbackAdmin(admin.ModelAdmin):
    list_display = ['ai_review', 'reviewer', 'agreed_with_recommendation', 'override_recommendation', 'created_at']
    list_filter = ['agreed_with_recommendation', 'override_recommendation']
