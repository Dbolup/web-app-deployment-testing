from rest_framework import serializers
from tenders.serializers import TenderListSerializer
from accounts.serializers import UserSerializer
from tenders.models import Tender
from accounts.models import User
from .models import PipelineItem, StageHistory


class StageHistorySerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)

    class Meta:
        model = StageHistory
        fields = ['id', 'from_stage', 'to_stage', 'changed_by', 'changed_at', 'note']
        read_only_fields = ['id', 'changed_at']


class PipelineItemSerializer(serializers.ModelSerializer):
    tender = TenderListSerializer(read_only=True)
    tender_id = serializers.PrimaryKeyRelatedField(
        queryset=Tender.objects.all(), source='tender', write_only=True
    )
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',
        write_only=True,
        required=False,
        allow_null=True,
    )
    stage_history = StageHistorySerializer(many=True, read_only=True)

    class Meta:
        model = PipelineItem
        fields = [
            'id', 'tender', 'tender_id', 'stage', 'assigned_to', 'assigned_to_id',
            'notes', 'stage_history', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PipelineItemMoveSerializer(serializers.Serializer):
    stage = serializers.ChoiceField(choices=PipelineItem.Stage.choices)
    note = serializers.CharField(required=False, allow_blank=True)


class PipelineKanbanSerializer(serializers.Serializer):
    stage = serializers.CharField()
    label = serializers.CharField()
    items = PipelineItemSerializer(many=True)
    count = serializers.IntegerField()
