from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Tender, TenderScore, FetchLog


def _resolve_score(tender, workspace):
    """Return score data from TenderScore (legacy) or AIReview, whichever exists."""
    if not workspace:
        return None
    score = tender.scores.filter(workspace=workspace).first()
    if score:
        return TenderScoreSerializer(score).data
    # Fall back to AIReview (primary scoring path)
    from ai_review.models import AIReview
    review = tender.ai_reviews.filter(
        workspace=workspace, review_status='completed'
    ).first()
    if review:
        return {
            'id': review.id,
            'ai_score': review.ai_score,
            'status': review.recommendation or 'new',
            'feasibility_score': review.feasibility_score,
            'risk_level': review.risk_level,
            'capability_alignment': review.capability_alignment,
            'executive_summary': review.executive_summary,
        }
    return None


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
        return _resolve_score(obj, self.context.get('workspace'))


def _raw_description(raw: dict) -> str:
    """Extract description from a raw OCDS release dict (stored in Tender.raw_data)."""
    tender = raw.get("tender", {})
    desc = (tender.get("description") or "").strip()
    if desc:
        return desc
    lots = tender.get("lots", [])
    parts: list[str] = []
    for lot in lots:
        lot_desc = (lot.get("description") or "").strip()
        if not lot_desc:
            continue
        lot_title = (lot.get("title") or "").strip()
        parts.append(f"{lot_title}\n{lot_desc}" if lot_title else lot_desc)
    return "\n\n".join(parts)


def _raw_scope(raw: dict) -> str:
    """Extract scope from a raw OCDS release dict."""
    rationale = (raw.get("planning", {}).get("rationale") or "").strip()
    if rationale:
        return rationale
    lots = raw.get("tender", {}).get("lots", [])
    titles = [lot.get("title", "").strip() for lot in lots if lot.get("title")]
    return "; ".join(titles) if titles else ""


class TenderDetailSerializer(serializers.ModelSerializer):
    days_until_deadline = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    scope = serializers.SerializerMethodField()

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
        return _resolve_score(obj, self.context.get('workspace'))

    @extend_schema_field(serializers.CharField())
    def get_description(self, obj):
        return obj.description or _raw_description(obj.raw_data or {})

    @extend_schema_field(serializers.CharField())
    def get_scope(self, obj):
        return obj.scope or _raw_scope(obj.raw_data or {})


class TenderScoreUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderScore
        fields = ['ai_score', 'status', 'feasibility_score', 'risk_level', 'capability_alignment', 'executive_summary']


class FetchLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FetchLog
        fields = '__all__'
        read_only_fields = ['id', 'fetched_at']
