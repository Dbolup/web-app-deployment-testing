from rest_framework import serializers
from .models import Integration


class IntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ['id', 'name', 'integration_type', 'status', 'last_sync', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Never expose config (may contain API keys) in list responses
        return data


class IntegrationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Integration
        fields = ['id', 'name', 'integration_type', 'status', 'config', 'last_sync']
        read_only_fields = ['id']
