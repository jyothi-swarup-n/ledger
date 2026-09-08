import os
import asyncio
import logging

import resend

logger = logging.getLogger("email")

APP_NAME = os.environ.get("APP_NAME", "Ledger by Arsonist")


def email_enabled() -> bool:
    return bool(os.environ.get("RESEND_API_KEY"))


def _otp_html(title: str, code: str, note: str) -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr><td align="center">
    <table width="440" cellpadding="0" cellspacing="0" style="background:#141824;border:2px solid #c3f400;border-radius:16px;padding:32px;">
      <tr><td style="color:#c3f400;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">{APP_NAME}</td></tr>
      <tr><td style="color:#ffffff;font-size:22px;font-weight:900;padding-top:12px;">{title}</td></tr>
      <tr><td style="color:#a1a1aa;font-size:14px;padding-top:8px;line-height:20px;">{note}</td></tr>
      <tr><td align="center" style="padding:28px 0;">
        <div style="display:inline-block;background:#0b0e14;border:1px solid #2a334a;border-radius:12px;padding:16px 28px;color:#c3f400;font-size:32px;font-weight:900;letter-spacing:10px;font-family:'Courier New',monospace;">{code}</div>
      </td></tr>
      <tr><td style="color:#71717a;font-size:12px;line-height:18px;">This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.</td></tr>
    </table>
  </td></tr>
</table>"""


async def _send(to: str, subject: str, html: str):
    if not email_enabled():
        logger.warning("RESEND_API_KEY not set - email to %s suppressed. Subject: %s", to, subject)
        return
    resend.api_key = os.environ["RESEND_API_KEY"]
    params = {"from": os.environ["SENDER_EMAIL"], "to": [to], "subject": subject, "html": html}
    try:
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        raise


async def send_verification_otp(to: str, code: str):
    await _send(
        to,
        f"{code} is your {APP_NAME} verification code",
        _otp_html("Verify your email", code, "Enter this code in the app to finish creating your account."),
    )


async def send_password_reset_otp(to: str, code: str):
    await _send(
        to,
        f"{code} is your {APP_NAME} password reset code",
        _otp_html("Reset your password", code, "Enter this code in the app to set a new password."),
    )
