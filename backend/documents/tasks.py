import base64
import logging
import os
import zipfile
import xml.etree.ElementTree as ET

import anthropic
from django.tasks import task

from .models import Document, ExtractedSection

logger = logging.getLogger(__name__)

_TOOL_NAME = 'extract_document_sections'
_TOOL_SCHEMA = {
    'name': _TOOL_NAME,
    'description': 'Extract structured sections from a tender or procurement document.',
    'input_schema': {
        'type': 'object',
        'properties': {
            'sections': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'section_type': {
                            'type': 'string',
                            'enum': ['scope_of_work', 'deliverables', 'evaluation_criteria', 'timeline', 'requirements', 'other'],
                        },
                        'title': {'type': 'string', 'description': 'Human-readable section title'},
                        'content': {
                            'description': (
                                'Section content. '
                                'scope_of_work/other: plain string. '
                                'deliverables/requirements: array of strings. '
                                'evaluation_criteria: object mapping criterion name to weighting e.g. {"Technical Merit": "40%"}. '
                                'timeline: object mapping event name to date string e.g. {"Submission Deadline": "14 Oct 2024"}.'
                            ),
                        },
                        'accuracy_score': {'type': 'number', 'description': 'Confidence 0.0-1.0 that this section was correctly extracted.'},
                        'ai_verified': {'type': 'boolean', 'description': 'True if the extracted content is clearly present verbatim.'},
                    },
                    'required': ['section_type', 'title', 'content', 'accuracy_score', 'ai_verified'],
                },
            },
            'pages_count': {'type': 'integer', 'description': 'Estimated number of pages in the document'},
        },
        'required': ['sections', 'pages_count'],
    },
}


def _extract_docx_text(path: str) -> str:
    ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    texts = []
    try:
        with zipfile.ZipFile(path) as z:
            with z.open('word/document.xml') as f:
                for elem in ET.parse(f).iter(f'{{{ns}}}t'):
                    if elem.text:
                        texts.append(elem.text)
    except Exception as exc:
        logger.warning('DOCX text extraction failed: %s', exc)
    return ' '.join(texts)


def _set_progress(doc: Document, pct: int) -> None:
    doc.processing_progress = pct
    doc.save(update_fields=['processing_progress'])


@task
def process_document_task(document_id: int) -> None:
    try:
        doc = Document.objects.get(pk=document_id)
    except Document.DoesNotExist:
        return

    _set_progress(doc, 10)

    api_key = os.getenv('ANTHROPIC_API_KEY', '')
    if not api_key:
        doc.status = Document.Status.FAILED
        doc.save(update_fields=['status'])
        logger.error('ANTHROPIC_API_KEY not set — cannot process document %s', document_id)
        return

    client = anthropic.Anthropic(api_key=api_key)
    file_path = doc.file.path
    mime = doc.mime_type or ''

    try:
        _set_progress(doc, 30)

        if 'pdf' in mime or file_path.lower().endswith('.pdf'):
            with open(file_path, 'rb') as f:
                file_b64 = base64.standard_b64encode(f.read()).decode()
            user_content = [
                {
                    'type': 'document',
                    'source': {'type': 'base64', 'media_type': 'application/pdf', 'data': file_b64},
                },
                {
                    'type': 'text',
                    'text': (
                        'Extract all key sections from this tender/procurement document. '
                        'Call extract_document_sections with every section you identify.'
                    ),
                },
            ]
        elif 'docx' in mime or 'doc' in mime or file_path.lower().endswith(('.docx', '.doc')):
            text = _extract_docx_text(file_path)
            if not text.strip():
                doc.status = Document.Status.FAILED
                doc.save(update_fields=['status'])
                return
            user_content = [{'type': 'text', 'text': (
                f'Extract all key sections from this tender document:\n\n{text[:40000]}\n\n'
                'Call extract_document_sections with every section you identify.'
            )}]
        else:
            doc.status = Document.Status.FAILED
            doc.save(update_fields=['status'])
            return

        _set_progress(doc, 50)

        response = client.messages.create(
            model='claude-haiku-4-5',
            max_tokens=4096,
            tools=[_TOOL_SCHEMA],
            tool_choice={'type': 'any'},
            messages=[{'role': 'user', 'content': user_content}],
        )

        _set_progress(doc, 85)

        result = None
        for block in response.content:
            if block.type == 'tool_use' and block.name == _TOOL_NAME:
                result = block.input
                break

        if not result:
            doc.status = Document.Status.FAILED
            doc.save(update_fields=['status'])
            return

        for section in result.get('sections', []):
            ExtractedSection.objects.create(
                document=doc,
                section_type=section.get('section_type', 'other'),
                title=section.get('title', ''),
                content=section.get('content', ''),
                accuracy_score=float(section.get('accuracy_score', 0.9)),
                ai_verified=bool(section.get('ai_verified', True)),
            )

        doc.status = Document.Status.PROCESSED
        doc.pages_count = int(result.get('pages_count', 0))
        doc.processing_progress = 100
        doc.save(update_fields=['status', 'pages_count', 'processing_progress'])

    except Exception:
        logger.exception('Document processing failed for doc %s', document_id)
        doc.status = Document.Status.FAILED
        doc.save(update_fields=['status'])
