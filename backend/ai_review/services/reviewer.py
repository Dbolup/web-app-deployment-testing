import json
import logging
import os
import anthropic

logger = logging.getLogger(__name__)

_TOOL_NAME = 'submit_tender_review'

_TOOL_SCHEMA = {
    'name': _TOOL_NAME,
    'description': (
        'Submit a structured AI review of a government tender against the company profile. '
        'Call this once with all fields populated.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'ai_score': {
                'type': 'integer',
                'description': 'Overall match score 0-100 representing how well this tender fits the company.',
            },
            'feasibility_score': {
                'type': 'integer',
                'description': 'Delivery feasibility score 0-100 based on company capabilities vs tender requirements.',
            },
            'risk_level': {
                'type': 'string',
                'enum': ['low', 'medium', 'high'],
                'description': 'Overall risk assessment for pursuing this tender.',
            },
            'capability_alignment': {
                'type': 'array',
                'description': 'List of key tender requirements and whether the company can meet them.',
                'items': {
                    'type': 'object',
                    'properties': {
                        'label': {'type': 'string', 'description': 'Requirement name (concise, max 6 words)'},
                        'met': {
                            'type': 'boolean',
                            'description': 'True if the company meets this requirement, false if not.',
                        },
                    },
                    'required': ['label', 'met'],
                },
            },
            'executive_summary': {
                'type': 'string',
                'description': (
                    '2-3 sentence executive summary starting with a strong assessment. '
                    'Reference specific company capabilities and tender requirements.'
                ),
            },
            'recommendation': {
                'type': 'string',
                'enum': ['pursue', 'review', 'skip'],
                'description': (
                    'pursue = strong fit, bid now; '
                    'review = borderline, needs discussion; '
                    'skip = poor fit or high risk.'
                ),
            },
            'rationale': {
                'type': 'string',
                'description': '1-2 sentences explaining the recommendation.',
            },
        },
        'required': [
            'ai_score', 'feasibility_score', 'risk_level',
            'capability_alignment', 'executive_summary', 'recommendation', 'rationale',
        ],
    },
}


def _build_system_prompt(profile) -> str:
    cap_str = ', '.join(profile.capabilities) if profile.capabilities else 'Not specified'
    cert_str = ', '.join(profile.certifications) if profile.certifications else 'Not specified'
    sector_str = ', '.join(profile.sectors) if profile.sectors else 'Not specified'
    budget_range = ''
    if profile.typical_contract_min or profile.typical_contract_max:
        lo = f'£{profile.typical_contract_min:,.0f}' if profile.typical_contract_min else 'any'
        hi = f'£{profile.typical_contract_max:,.0f}' if profile.typical_contract_max else 'any'
        budget_range = f'Typical contract range: {lo} – {hi}'
    excluded = ', '.join(profile.excluded_keywords) if profile.excluded_keywords else 'None'

    return f"""You are a bid qualification AI for {profile.company_name}.

COMPANY PROFILE
Name: {profile.company_name}
Description: {profile.description or 'Not provided'}
Capabilities: {cap_str}
Certifications: {cert_str}
Sectors: {sector_str}
{budget_range}
Excluded keywords (auto-disqualify): {excluded}

Your job is to review UK government tenders against this profile and produce an objective, structured assessment. Be honest — overscoring hurts more than underscoring. Use the submit_tender_review tool to return your analysis."""


def _build_user_message(tender) -> str:
    budget = ''
    if tender.budget_min is not None or tender.budget_max is not None:
        lo = f'£{tender.budget_min:,.0f}' if tender.budget_min is not None else '?'
        hi = f'£{tender.budget_max:,.0f}' if tender.budget_max is not None else '?'
        budget = f'Budget: {lo} – {hi}'

    deadline = tender.deadline.strftime('%d %b %Y') if tender.deadline else 'Not specified'

    raw = tender.raw_data or {}
    tender_obj = raw.get('tender', {})
    description = tender_obj.get('description') or tender.description or 'No description available.'
    criteria = ''
    if tender_obj.get('selectionCriteria'):
        criteria_list = tender_obj['selectionCriteria'].get('criteria', [])
        if criteria_list:
            criteria = '\nSelection Criteria:\n' + '\n'.join(
                f'- {c.get("title", "")}: {c.get("description", "")}'
                for c in criteria_list[:5]
            )

    return f"""Please review this UK government tender:

Title: {tender.title}
Reference: {tender.ref_id}
Organisation: {tender.organization or 'Not specified'}
Notice Type: {tender.notice_type or 'Not specified'}
Industry: {tender.industry or 'Not specified'}
Location: {tender.location or 'Not specified'}
{budget}
Deadline: {deadline}

Description:
{description[:2000]}
{criteria}

Assess this tender against the company profile and call submit_tender_review with your structured analysis."""


def run_review(tender, profile) -> dict:
    """
    Run an AI review of `tender` against `profile`.
    Returns the tool input dict from Claude.
    Raises on API error.
    """
    api_key = os.getenv('ANTHROPIC_API_KEY', '')
    if not api_key:
        raise ValueError('ANTHROPIC_API_KEY is not set')

    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=4096,
        system=_build_system_prompt(profile),
        tools=[_TOOL_SCHEMA],
        tool_choice={'type': 'any'},
        messages=[{'role': 'user', 'content': _build_user_message(tender)}],
    )

    for block in response.content:
        if block.type == 'tool_use' and block.name == _TOOL_NAME:
            return block.input

    raise RuntimeError('Claude did not call the expected tool')
