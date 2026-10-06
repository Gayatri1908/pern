"""OTP Service for Two-Factor Authentication."""

from __future__ import annotations

import secrets
import structlog

from app.config import get_settings
from app.utils.redis import get_redis

logger = structlog.stdlib.get_logger(__name__)


from app.services.verification import send_twilio_sms, send_smtp_email


async def generate_otp(identifier: str) -> str:
    """Generate a 6-digit OTP, store in Redis, and deliver via Twilio SMS / Email."""
    code = f"{secrets.SystemRandom().randint(100000, 999999)}"
    redis = get_redis()

    # Store OTP and reset attempts
    await redis.setex(f"otp:val:{identifier}", 300, code)
    await redis.delete(f"otp:attempts:{identifier}")

    sms_body = f"Your The Source Company verification OTP code is: {code}. It expires in 5 minutes."

    if any(char.isdigit() for char in identifier) and "@" not in identifier:
        await send_twilio_sms(identifier, sms_body)
    else:
        await send_smtp_email(identifier, "Your Verification OTP Code", sms_body)

    return code


async def verify_otp(email: str, code: str) -> bool:
    """Verify an OTP for a given email. Invalidates the OTP on success or after 3 failed attempts."""
    redis = get_redis()

    val_key = f"otp:val:{email}"
    attempts_key = f"otp:attempts:{email}"

    stored_code = await redis.get(val_key)
    if not stored_code:
        logger.warning("otp_verification_failed_expired_or_not_found", email=email)
        return False

    if stored_code == code:
        # Success, delete the verification data
        await redis.delete(val_key)
        await redis.delete(attempts_key)
        logger.info("otp_verification_success", email=email)
        return True

    # Failed attempt: increment and check lockout
    attempts = await redis.incr(attempts_key)
    if attempts == 1:
        await redis.expire(attempts_key, 300)

    if attempts >= 3:
        # Exceeded max attempts: delete OTP to block further attempts
        await redis.delete(val_key)
        await redis.delete(attempts_key)
        logger.warning("otp_lockout_max_attempts_reached", email=email)
    else:
        logger.warning("otp_verification_failed_incorrect", email=email, attempts=attempts)

    return False
