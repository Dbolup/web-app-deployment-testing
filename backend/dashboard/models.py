from django.db import models
from accounts.models import User, Workspace
from tenders.models import Tender


class Activity(models.Model):
    class ActivityType(models.TextChoices):
        AI = 'ai', 'AI'
        SYSTEM = 'system', 'System'
        USER = 'user', 'User'
        DRAFTED = 'drafted', 'Drafted'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    prefix = models.CharField(max_length=300)
    highlight = models.CharField(max_length=300)
    tender = models.ForeignKey(
        Tender, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.activity_type}: {self.prefix} {self.highlight}'
