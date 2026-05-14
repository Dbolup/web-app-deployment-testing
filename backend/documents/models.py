from django.db import models
from accounts.models import User, Workspace
from tenders.models import Tender


class Document(models.Model):
    class Status(models.TextChoices):
        UPLOADED = 'uploaded', 'Uploaded'
        PROCESSING = 'processing', 'Processing'
        PROCESSED = 'processed', 'Processed'
        FAILED = 'failed', 'Failed'

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='documents')
    tender = models.ForeignKey(
        Tender, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents'
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='documents/%Y/%m/')
    filename = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
    processing_progress = models.IntegerField(default=0)
    pages_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.filename


class ExtractedSection(models.Model):
    class SectionType(models.TextChoices):
        SCOPE_OF_WORK = 'scope_of_work', 'Scope of Work'
        DELIVERABLES = 'deliverables', 'Deliverables'
        EVALUATION_CRITERIA = 'evaluation_criteria', 'Evaluation Criteria'
        TIMELINE = 'timeline', 'Timeline'
        REQUIREMENTS = 'requirements', 'Requirements'
        OTHER = 'other', 'Other'

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='sections')
    section_type = models.CharField(max_length=30, choices=SectionType.choices)
    title = models.CharField(max_length=200)
    content = models.JSONField()
    accuracy_score = models.FloatField(default=0.0)
    ai_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['section_type']

    def __str__(self):
        return f'{self.document.filename} - {self.section_type}'
