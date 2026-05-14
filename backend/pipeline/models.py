from django.db import models
from accounts.models import User, Workspace
from tenders.models import Tender


class PipelineItem(models.Model):
    class Stage(models.TextChoices):
        NEW = 'new', 'New Tenders'
        AI_QUALIFIED = 'ai_qualified', 'AI Qualified'
        UNDER_REVIEW = 'under_review', 'Under Review'
        IN_PROGRESS = 'in_progress', 'In Progress'
        BLOCKED = 'blocked', 'Blocked'
        SUBMITTED = 'submitted', 'Submitted'
        ON_HOLD = 'on_hold', 'On Hold'
        VIABLE = 'viable', 'Viable'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='pipeline_items')
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='pipeline_items')
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.NEW)
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_pipeline_items'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('workspace', 'tender')
        ordering = ['stage', '-created_at']

    def __str__(self):
        return f'{self.tender.ref_id} - {self.stage}'


class StageHistory(models.Model):
    pipeline_item = models.ForeignKey(
        PipelineItem, on_delete=models.CASCADE, related_name='stage_history'
    )
    from_stage = models.CharField(max_length=20, choices=PipelineItem.Stage.choices, blank=True)
    to_stage = models.CharField(max_length=20, choices=PipelineItem.Stage.choices)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.pipeline_item} {self.from_stage} → {self.to_stage}'
