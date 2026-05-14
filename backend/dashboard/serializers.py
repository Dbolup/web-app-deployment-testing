from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    tender_ref = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ['id', 'activity_type', 'prefix', 'highlight', 'tender', 'tender_ref', 'created_at']
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_tender_ref(self, obj):
        if obj.tender:
            return obj.tender.ref_id
        return None
