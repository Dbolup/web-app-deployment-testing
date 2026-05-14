from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Tender, TenderScore, FetchLog


class TenderScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderScore
        fields = [
            'id', 'ai_score', 'status', 'feasibility_score', 'risk_level',
            'capability_alignment', 'executive_summary', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenderListSerializer(serializers.ModelSerializer):
    days_until_deadline = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = [
            'id', 'ref_id', 'title', 'organization', 'department',
            'budget_display', 'budget_min', 'budget_max',
            'deadline', 'published_date', 'days_until_deadline',
            'location', 'industry', 'notice_type', 'source_url',
            'score', 'created_at',
        ]

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_days_until_deadline(self, obj):
        return obj.days_until_deadline()

    @extend_schema_field(TenderScoreSerializer(allow_null=True))
    def get_score(self, obj):
        workspace = self.context.get('workspace')
        if workspace:
            score = obj.scores.filter(workspace=workspace).first()
            if score:
                return TenderScoreSerializer(score).data
        return None


class TenderDetailSerializer(serializers.ModelSerializer):
    days_until_deadline = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta:
        model = Tender
        fields = [
            'id', 'ref_id', 'title', 'organization', 'department',
            'description', 'scope', 'deliverables', 'evaluation_criteria', 'timeline',
            'budget_display', 'budget_min', 'budget_max',
            'deadline', 'published_date', 'days_until_deadline',
            'location', 'industry', 'cpv_codes', 'notice_type', 'source_url',
            'score', 'created_at', 'updated_at',
        ]

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_days_until_deadline(self, obj):
        return obj.days_until_deadline()

    @extend_schema_field(TenderScoreSerializer(allow_null=True))
    def get_score(self, obj):
        workspace = self.context.get('workspace')
        if workspace:
            score = obj.scores.filter(workspace=workspace).first()
            if score:
                return TenderScoreSerializer(score).data
        return None


class TenderScoreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderScore
        fields = ['ai_score', 'status', 'feasibility_score', 'risk_level', 'capability_alignment', 'executive_summary']


class FetchLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FetchLog
        fields = '__all__'
        read_only_fields = ['id', 'fetched_at']
