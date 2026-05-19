from django.conf import settings
from django.core.mail import send_mail
from django.tasks import task


@task
def send_invite_email(
    email: str,
    workspace_name: str,
    role: str,
    token: str,
    invited_by: str,
) -> None:
    app_url = settings.APP_URL.rstrip('/')
    accept_url = f"{app_url}/accept-invite/{token}"
    role_display = role.capitalize()

    subject = f"You're invited to join {workspace_name} on TenderFlow"

    html_message = f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#00236f;padding:32px 40px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;">TenderFlow AI</p>
          <h1 style="margin:10px 0 0;font-size:24px;font-weight:700;color:#ffffff;">You&rsquo;ve been invited</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 24px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            <strong>{invited_by}</strong> has invited you to join <strong>{workspace_name}</strong> on TenderFlow as a <strong>{role_display}</strong>.
          </p>

          <!-- Role badge -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#eff6ff;border:1px solid #dce2f3;border-radius:8px;padding:12px 20px;">
                <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Your role</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#00236f;">{role_display}</p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="{accept_url}" style="display:inline-block;background:#00236f;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;">
                  Accept Invitation
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
            Or copy this link: <a href="{accept_url}" style="color:#00236f;word-break:break-all;">{accept_url}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            This invitation expires in 7 days. If you weren&rsquo;t expecting this, you can safely ignore it.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""

    plain_text = (
        f"You've been invited to join {workspace_name} on TenderFlow\n\n"
        f"{invited_by} has invited you as a {role_display}.\n\n"
        f"Accept your invitation here:\n{accept_url}\n\n"
        f"This invitation expires in 7 days."
    )

    send_mail(
        subject=subject,
        message=plain_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )
