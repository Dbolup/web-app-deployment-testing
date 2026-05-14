from django.db import models
from django.conf import settings
from accounts.models import Workspace
from tenders.models import Tender


class CompanyProfile(models.Model):
    workspace = models.OneToOneField(Workspace, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    capabilities = models.JSONField(default=list, help_text='List of capability strings')
    certifications = models.JSONField(default=list, help_text='List of certification strings')
    sectors = models.JSONField(default=list, help_text='Primary sectors/industries served')
    typical_contract_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    typical_contract_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    excluded_keywords = models.JSONField(default=list, help_text='Keywords to filter out')
    preferred_notice_types = models.JSONField(default=list, help_text='OCDS notice types to prioritise')
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.company_name} ({self.workspace})'


class AIReview(models.Model):
    class RiskLevel(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class ReviewStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    class Recommendation(models.TextChoices):
        PURSUE = 'pursue', 'Pursue'
        REVIEW = 'review', 'Review'
        SKIP = 'skip', 'Skip'

    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='ai_reviews')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='ai_reviews')

    ai_score = models.IntegerField(null=True, blank=True, help_text='Overall AI match score 0-100')
    feasibility_score = models.IntegerField(null=True, blank=True, help_text='Delivery feasibility 0-100')
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, null=True, blank=True)
    capability_alignment = models.JSONField(
        default=list,
        help_text='[{"name": "Cloud Migration", "status": "Requirement Met"}]'
    )
    executive_summary = models.TextField(blank=True)
    recommendation = models.CharField(max_length=10, choices=Recommendation.choices, null=True, blank=True)
    rationale = models.TextField(blank=True)

    review_status = models.CharField(max_length=10, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    model_used = models.CharField(max_length=50, default="claude-haiku-4-5")
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tender', 'workspace')
        ordering = ['-updated_at']

    def __str__(self):
        return f'Review {self.tender.ref_id} / {self.workspace}'


class HumanFeedback(models.Model):
    ai_review = models.OneToOneField(AIReview, on_delete=models.CASCADE, related_name='human_feedback')
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='feedback_given'
    )
    agreed_with_recommendation = models.BooleanField(null=True, blank=True)
    override_recommendation = models.CharField(
        max_length=10, choices=AIReview.Recommendation.choices, blank=True
    )
    feedback_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Feedback for {self.ai_review}'
