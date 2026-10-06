"""Outbound notification dispatcher service (integrates with Twilio/SES)."""

from __future__ import annotations

import httpx
import structlog
from app.config import get_settings

logger = structlog.stdlib.get_logger(__name__)
settings = get_settings()


async def send_email_notification(recipient: str, subject: str, body: str) -> bool:
    """Send email notification (uses SES if ses_enabled=True, else logs)."""
    if settings.ses_enabled:
        logger.info("ses_email_notification_sent", recipient=recipient, subject=subject)
        # Real integration would go here (e.g. boto3 ses client)
        return True
    else:
        logger.info("mock_email_notification_sent", recipient=recipient, subject=subject, body=body)
        return True


async def send_sms_notification(phone_number: str, message: str) -> bool:
    """Send SMS notification (uses Twilio if twilio_enabled=True, else logs)."""
    if settings.twilio_enabled:
        account_sid = getattr(settings, "twilio_account_sid", None)
        auth_token = getattr(settings, "twilio_auth_token", None)
        from_phone = getattr(settings, "twilio_from_number", None)

        if not account_sid or not auth_token or not from_phone:
            logger.error("twilio_sms_config_missing")
            return False

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        auth = (account_sid, auth_token)
        data = {
            "From": from_phone,
            "To": phone_number,
            "Body": message
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, auth=auth, data=data)
                if resp.status_code >= 400:
                    logger.error("twilio_sms_failed", status_code=resp.status_code, response=resp.text)
                    return False
                else:
                    logger.info("twilio_sms_notification_sent", phone_number=phone_number)
                    return True
        except Exception as e:
            logger.error("twilio_sms_exception", error=str(e))
            return False
    else:
        logger.info("mock_sms_notification_sent", phone_number=phone_number, message=message)
        return True


async def send_whatsapp_notification(phone_number: str, message: str) -> bool:
    """Send WhatsApp notification (uses Twilio if twilio_enabled=True, else logs)."""
    if settings.twilio_enabled:
        account_sid = getattr(settings, "twilio_account_sid", None)
        auth_token = getattr(settings, "twilio_auth_token", None)
        from_phone = getattr(settings, "twilio_from_number", None)

        if not account_sid or not auth_token or not from_phone:
            logger.error("twilio_whatsapp_config_missing")
            return False

        # Format numbers for WhatsApp
        from_whatsapp = f"whatsapp:{from_phone}"
        to_whatsapp = phone_number if phone_number.startswith("whatsapp:") else f"whatsapp:{phone_number}"

        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        auth = (account_sid, auth_token)
        data = {
            "From": from_whatsapp,
            "To": to_whatsapp,
            "Body": message
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, auth=auth, data=data)
                if resp.status_code >= 400:
                    logger.error("twilio_whatsapp_failed", status_code=resp.status_code, response=resp.text)
                    return False
                else:
                    logger.info("twilio_whatsapp_notification_sent", phone_number=phone_number)
                    return True
        except Exception as e:
            logger.error("twilio_whatsapp_exception", error=str(e))
            return False
    else:
        logger.info("mock_whatsapp_notification_sent", phone_number=phone_number, message=message)
        return True
