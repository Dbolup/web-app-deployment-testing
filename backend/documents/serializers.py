from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Document, ExtractedSection


class ExtractedSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedSection
        fields = ['id', 'section_type', 'title', 'content', 'accuracy_score', 'ai_verified', 'created_at']
        read_only_fields = ['id', 'created_at']


class DocumentSerializer(serializers.ModelSerializer):
    sections = ExtractedSectionSerializer(many=True, read_only=True)
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'tender', 'filename', 'file', 'file_size', 'file_size_display',
            'mime_type', 'status', 'processing_progress', 'pages_count',
            'sections', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'filename', 'file_size', 'mime_type', 'status',
            'processing_progress', 'pages_count', 'created_at', 'updated_at',
        ]

    @extend_schema_field(serializers.CharField())
    def get_file_size_display(self, obj):
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['file', 'tender']

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['filename'] = file.name
        validated_data['file_size'] = file.size
        validated_data['mime_type'] = getattr(file, 'content_type', '')
        return super().create(validated_data)
