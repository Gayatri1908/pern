"""Verification Service for Email (SMTP/Gmail) and SMS (Twilio) OTP."""

from __future__ import annotations
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
import httpx
import structlog
from app.config import get_settings
from app.utils.redis import get_redis

logger = structlog.stdlib.get_logger(__name__)

async def send_smtp_email(to_email: str, subject: str, body_text: str):
    """Send an verification email using SMTP/Gmail (or fallback to log if not configured)."""
    settings = get_settings()
    # Read environment configs or fallback to empty
    smtp_host = getattr(settings, "smtp_host", "smtp.gmail.com")
    smtp_port = getattr(settings, "smtp_port", 587)
    smtp_user = getattr(settings, "smtp_user", None)
    smtp_pass = getattr(settings, "smtp_pass", None)

    if not smtp_user or not smtp_pass:
        logger.info("smtp_email_mock_log", to=to_email, subject=subject, body=body_text)
        print(f"\n[MOCK EMAIL SENT TO {to_email}]\nSubject: {subject}\nBody: {body_text}\n")
        return

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body_text, "plain"))

    try:
        def send():
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, send)
        logger.info("smtp_email_sent_success", to=to_email)
    except Exception as e:
        logger.error("smtp_email_exception", error=str(e))

async def send_twilio_sms(to_phone: str, body: str):
    """Send a verification SMS using Twilio HTTP API (or fallback to log if not configured)."""
    settings = get_settings()
    account_sid = getattr(settings, "twilio_account_sid", None)
    auth_token = getattr(settings, "twilio_auth_token", None)
    from_phone = getattr(settings, "twilio_from_number", None)

    if not account_sid or not auth_token or not from_phone:
        logger.info("twilio_sms_mock_log", to=to_phone, body=body)
        print(f"\n[MOCK SMS SENT TO {to_phone}]\nBody: {body}\n")
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    auth = (account_sid, auth_token)
    data = {
        "From": from_phone,
        "To": to_phone,
        "Body": body
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, auth=auth, data=data)
            if resp.status_code >= 400:
                logger.error("twilio_sms_failed", status_code=resp.status_code, response=resp.text)
            else:
                logger.info("twilio_sms_sent_success", to=to_phone)
    except Exception as e:
        logger.error("twilio_sms_exception", error=str(e))

async def generate_signup_otps(email: str, phone: str) -> dict[str, str]:
    """Generate OTPs for signup verification and store in Redis."""
    redis = get_redis()
    email_otp = f"{secrets.SystemRandom().randint(100000, 999999)}"
    phone_otp = f"{secrets.SystemRandom().randint(100000, 999999)}"

    # Save to redis with 10-minute expiry
    await redis.setex(f"signup:otp:email:{email}", 600, email_otp)
    await redis.setex(f"signup:otp:phone:{phone}", 600, phone_otp)

    # Deliver Email OTP
    email_body = f"Your The Source Company signup verification code is: {email_otp}. It expires in 10 minutes."
    await send_smtp_email(email, "Verify your email address", email_body)

    # Deliver SMS OTP
    sms_body = f"Your The Source Company phone verification code is: {phone_otp}. It expires in 10 minutes."
    await send_twilio_sms(phone, sms_body)

    return {"email_otp": email_otp, "phone_otp": phone_otp}

async def verify_signup_otps(email: str, phone: str, email_code: str, phone_code: str) -> bool:
    """Validate OTP codes for email and phone."""
    redis = get_redis()
    stored_email_otp = await redis.get(f"signup:otp:email:{email}")
    stored_phone_otp = await redis.get(f"signup:otp:phone:{phone}")

    # Convert bytes to string if needed
    if stored_email_otp:
        stored_email_otp = stored_email_otp.decode("utf-8") if isinstance(stored_email_otp, bytes) else stored_email_otp
    if stored_phone_otp:
        stored_phone_otp = stored_phone_otp.decode("utf-8") if isinstance(stored_phone_otp, bytes) else stored_phone_otp

    email_ok = (stored_email_otp == email_code)
    phone_ok = (stored_phone_otp == phone_code)

    if email_ok and phone_ok:
        # Clear verification data
        await redis.delete(f"signup:otp:email:{email}")
        await redis.delete(f"signup:otp:phone:{phone}")
        return True

    return False
