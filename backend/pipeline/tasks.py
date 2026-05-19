from datetime import date as _date

from django.conf import settings
from django.core.mail import send_mail
from django.tasks import task

from ai_review.models import AIReview
from tenders.models import Tender


def _build_review_email_html(tender, review, sender_name: str, app_url: str) -> str:
    score_display = f"{review.ai_score:.0f}/100" if review.ai_score is not None else "—"
    feasibility_display = f"{review.feasibility_score:.0f}/100" if review.feasibility_score is not None else "—"
    risk_display = (review.risk_level or "—").capitalize()
    rec_display = (review.recommendation or "—").capitalize()

    risk_color = {"low": "#16a34a", "medium": "#d97706", "high": "#ef4444"}.get(review.risk_level or "", "#64748b")
    rec_color = {"pursue": "#16a34a", "review": "#d97706", "skip": "#ef4444"}.get(review.recommendation or "", "#64748b")

    caps_rows = ""
    for cap in review.capability_alignment:
        label = cap.get('label') or cap.get('name', '')
        met = cap.get('met')
        if met is None:
            status_str = str(cap.get('status', '')).lower()
            met = 'met' in status_str and 'not met' not in status_str
        icon = "✅" if met else "❌"
        caps_rows += f"<tr><td style='padding:6px 0;font-size:14px;color:#374151;'>{icon}&nbsp;{label}</td></tr>"

    deadline_str = ""
    if tender.deadline:
        try:
            d = _date.fromisoformat(str(tender.deadline))
            deadline_str = d.strftime("%-d %B %Y")
        except Exception:
            deadline_str = str(tender.deadline)

    budget_str = tender.budget_display or ""
    if not budget_str and tender.budget_max:
        budget_str = f"Up to £{float(tender.budget_max) / 1e6:.1f}M"

    app_tender_url = f"{app_url.rstrip('/')}/pipeline/{tender.ref_id}"
    source_url = tender.source_url or ""

    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#00236f;padding:28px 36px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;">TenderFlow AI</p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Tender Review Summary</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#bfdbfe;">Shared by {sender_name}</p>
        </td></tr>

        <!-- Tender title -->
        <tr><td style="padding:28px 36px 0;">
          <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">{tender.title}</h2>
          <p style="margin:0;font-size:14px;color:#6b7280;">{tender.organization or ""}{(" · " + deadline_str) if deadline_str else ""}{(" · " + budget_str) if budget_str else ""}</p>
        </td></tr>

        <!-- Score row -->
        <tr><td style="padding:24px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:20px;border-right:1px solid #e5e7eb;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">AI Score</p>
                <p style="margin:0;font-size:28px;font-weight:800;color:#00236f;">{score_display}</p>
              </td>
              <td align="center" style="padding:20px;border-right:1px solid #e5e7eb;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Feasibility</p>
                <p style="margin:0;font-size:28px;font-weight:800;color:#00236f;">{feasibility_display}</p>
              </td>
              <td align="center" style="padding:20px;border-right:1px solid #e5e7eb;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Risk Level</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:{risk_color};">{risk_display}</p>
              </td>
              <td align="center" style="padding:20px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Recommendation</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:{rec_color};">{rec_display}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Executive summary -->
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Executive Summary</p>
          <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0;font-size:14px;color:#1e3a5f;line-height:1.6;font-style:italic;">{review.executive_summary}</p>
          </div>
        </td></tr>

        <!-- Rationale -->
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Rationale</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">{review.rationale}</p>
        </td></tr>

        {"" if not review.capability_alignment else f"""
        <!-- Capability alignment -->
        <tr><td style="padding:24px 36px 0;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;">Capability Alignment</p>
          <table width="100%" cellpadding="0" cellspacing="0">{caps_rows}</table>
        </td></tr>
        """}

        <!-- Links -->
        <tr><td style="padding:24px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:8px;">
                <a href="{app_tender_url}" style="display:block;text-align:center;background:#00236f;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:10px;">View in TenderFlow</a>
              </td>
              {"" if not source_url else f'<td style="padding-left:8px;"><a href="{source_url}" style="display:block;text-align:center;background:#f1f5f9;color:#00236f;font-size:14px;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:10px;border:1px solid #dce2f3;">View on Gov Platform</a></td>'}
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 36px;margin-top:24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Generated by TenderFlow AI · This review is based on AI analysis and should be considered alongside professional judgement.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


@task
def send_tender_review_email(ref_id: str, workspace_id: int, emails: list, sender_name: str) -> None:
    tender = Tender.objects.get(ref_id=ref_id)
    review = (
        AIReview.objects
        .filter(workspace_id=workspace_id, tender=tender, review_status=AIReview.ReviewStatus.COMPLETED)
        .order_by('-created_at')
        .first()
    )
    if not review:
        raise ValueError(f"No completed AI review found for tender {ref_id}")

    app_url = settings.APP_URL
    app_tender_url = f"{app_url.rstrip('/')}/pipeline/{tender.ref_id}"

    subject = f"Tender Review: {tender.title}"
    html_message = _build_review_email_html(tender, review, sender_name, app_url)
    plain_text = (
        f"Tender Review: {tender.title}\n\n"
        f"AI Score: {review.ai_score}/100\n"
        f"Recommendation: {review.recommendation}\n"
        f"Risk Level: {review.risk_level}\n\n"
        f"Executive Summary:\n{review.executive_summary}\n\n"
        f"Rationale:\n{review.rationale}\n\n"
        f"View in TenderFlow: {app_tender_url}\n"
        + (f"View on Gov Platform: {tender.source_url}\n" if tender.source_url else "")
    )

    send_mail(
        subject=subject,
        message=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=emails,
        html_message=html_message,
        fail_silently=False,
    )
