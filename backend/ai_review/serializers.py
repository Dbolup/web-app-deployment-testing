from rest_framework import serializers
from .models import CompanyProfile, AIReview, HumanFeedback
from pipeline.models import PipelineItem


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        exclude = ['workspace']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HumanFeedbackSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)

    class Meta:
        model = HumanFeedback
        exclude = ['ai_review', 'reviewer']
        read_only_fields = ['id', 'created_at', 'reviewer_name']


class AIReviewSerializer(serializers.ModelSerializer):
    tender_ref_id = serializers.CharField(source='tender.ref_id', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    human_feedback = HumanFeedbackSerializer(read_only=True)
    pipeline_stage = serializers.SerializerMethodField()
    pipeline_id = serializers.SerializerMethodField()

    def _get_pipeline_item(self, obj):
        try:
            return obj.tender.pipeline_items.get(workspace=obj.workspace)
        except PipelineItem.DoesNotExist:
            return None

    def get_pipeline_stage(self, obj):
        item = self._get_pipeline_item(obj)
        return item.stage if item else None

    def get_pipeline_id(self, obj):
        item = self._get_pipeline_item(obj)
        return item.id if item else None

    class Meta:
        model = AIReview
        exclude = ['workspace']
        read_only_fields = [
            'id', 'tender', 'tender_ref_id', 'tender_title',
            'ai_score', 'feasibility_score', 'risk_level', 'capability_alignment',
            'executive_summary', 'recommendation', 'rationale',
            'review_status', 'model_used', 'error_message',
            'created_at', 'updated_at',
        ]


class HumanFeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HumanFeedback
        fields = ['agreed_with_recommendation', 'override_recommendation', 'feedback_text']

    def validate_override_recommendation(self, value):
        valid = [c.value for c in AIReview.Recommendation]
        if value and value not in valid:
            raise serializers.ValidationError(f'Must be one of: {", ".join(valid)}')
        return value


class BulkReviewRequestSerializer(serializers.Serializer):
    ref_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        max_length=20,
        help_text='Optional list of tender ref_ids to review (max 20). Omit to auto-select.',
    )


class TenderSuggestionSerializer(serializers.Serializer):
    ref_id = serializers.CharField()
    title = serializers.CharField()
    organization = serializers.CharField()
    deadline = serializers.DateTimeField()
    budget_min = serializers.FloatField(allow_null=True)
    budget_max = serializers.FloatField(allow_null=True)
    industry = serializers.CharField(allow_null=True)
    ai_score = serializers.IntegerField(allow_null=True)
    feasibility_score = serializers.IntegerField(allow_null=True)
    risk_level = serializers.CharField(allow_null=True)
    recommendation = serializers.CharField(allow_null=True)
    executive_summary = serializers.CharField(allow_null=True)
