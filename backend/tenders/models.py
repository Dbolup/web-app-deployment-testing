from django.db import models
from accounts.models import User, Workspace


class Tender(models.Model):
    ref_id = models.CharField(max_length=200, unique=True)
    title = models.CharField(max_length=500)
    organization = models.CharField(max_length=300)
    department = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    scope = models.TextField(blank=True)
    deliverables = models.JSONField(default=list)
    evaluation_criteria = models.JSONField(default=dict)
    timeline = models.JSONField(default=dict)

    budget_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_display = models.CharField(max_length=200, blank=True)

    deadline = models.DateTimeField(null=True, blank=True)
    published_date = models.DateTimeField(null=True, blank=True)

    location = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=200, blank=True)
    cpv_codes = models.JSONField(default=list)
    notice_type = models.CharField(max_length=100, blank=True)

    source_url = models.URLField(max_length=500, blank=True)
    raw_data = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_date', '-created_at']

    def days_until_deadline(self):
        if not self.deadline:
            return None
        from django.utils import timezone
        delta = self.deadline - timezone.now()
        return max(0, delta.days)

    def __str__(self):
        return f'{self.ref_id} - {self.title}'


class TenderScore(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        SELECTED = 'selected', 'Selected'
        REVIEWED = 'reviewed', 'Reviewed'

    class RiskLevel(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='scores')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='tender_scores')
    ai_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    feasibility_score = models.IntegerField(default=0)
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, default=RiskLevel.MEDIUM)
    capability_alignment = models.JSONField(default=list)
    executive_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('tender', 'workspace')

    def __str__(self):
        return f'{self.tender.ref_id} score for {self.workspace.name}'


class FetchLog(models.Model):
    class FetchStatus(models.TextChoices):
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        PARTIAL = 'partial', 'Partial'

    fetched_at = models.DateTimeField(auto_now_add=True)
    tenders_found = models.IntegerField(default=0)
    tenders_new = models.IntegerField(default=0)
    tenders_updated = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=FetchStatus.choices)
    error_message = models.TextField(blank=True)
    query_params = models.JSONField(default=dict)

    class Meta:
        ordering = ['-fetched_at']

    def __str__(self):
        return f'Fetch {self.fetched_at} - {self.status}'
