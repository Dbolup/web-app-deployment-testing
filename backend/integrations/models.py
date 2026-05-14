from django.db import models
from accounts.models import Workspace


class Integration(models.Model):
    class IntegrationType(models.TextChoices):
        GOV_TENDER = 'gov_tender', 'GovTender API'
        CONFLUENCE = 'confluence', 'Confluence'
        SLACK = 'slack', 'Slack'
        TEAMS = 'teams', 'Microsoft Teams'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        CONNECTED = 'connected', 'Connected'
        DISCONNECTED = 'disconnected', 'Disconnected'
        ERROR = 'error', 'Error'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='integrations')
    name = models.CharField(max_length=100)
    integration_type = models.CharField(max_length=30, choices=IntegrationType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DISCONNECTED)
    config = models.JSONField(default=dict)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('workspace', 'integration_type')
        ordering = ['name']

    def __str__(self):
        return f'{self.workspace.name} - {self.name}'
