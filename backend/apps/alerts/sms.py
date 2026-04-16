"""
Sparrow SMS service for किसान बजार.
Nepal's Sparrow SMS gateway: https://api.sparrowsms.com/v2/sms/
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

SPARROW_API_URL = "https://api.sparrowsms.com/v2/sms/"
SPARROW_SENDER  = "KisanBazar"


class SparrowSMS:
    """
    Thin wrapper around the Sparrow SMS v2 API.

    Usage:
        sms = SparrowSMS()
        ok  = sms.send_sms("9800000001", "Hello!")

    The send_sms() method never raises — it logs errors and returns False
    so callers can fire-and-forget without try/except.
    """

    def __init__(self):
        self.token = getattr(settings, "SPARROW_SMS_TOKEN", "")

    def is_configured(self) -> bool:
        """Return True only when a real token is present in settings."""
        return bool(self.token) and self.token != "your-sparrow-token"

    def send_sms(self, phone: str, message: str) -> bool:
        """
        Send a single SMS.

        Args:
            phone:   Recipient's mobile number (e.g. "9800000001").
            message: SMS body (keep under 160 chars for one credit).

        Returns:
            True  — Sparrow accepted the request (response_code 200).
            False — Not configured, network error, or API rejection.
        """
        if not self.is_configured():
            logger.debug(
                "Sparrow SMS not configured — skipping SMS to %s", phone
            )
            return False

        if not phone:
            logger.warning("send_sms called with empty phone number")
            return False

        payload = {
            "token": self.token,
            "from":  SPARROW_SENDER,
            "to":    phone,
            "text":  message,
        }

        try:
            resp = requests.post(SPARROW_API_URL, json=payload, timeout=10)
            resp.raise_for_status()

            data = resp.json()
            # Sparrow returns response_code 200 on success
            if data.get("response_code") == 200:
                logger.info(
                    "SMS sent to %s | credits_remaining=%s",
                    phone,
                    data.get("credits_remaining", "?"),
                )
                return True

            # Non-200 response_code means API-level failure
            logger.warning(
                "Sparrow SMS rejected for %s: %s",
                phone,
                data.get("message", resp.text[:200]),
            )
            return False

        except requests.Timeout:
            logger.warning("Sparrow SMS timed out for %s", phone)
            return False
        except requests.HTTPError as exc:
            logger.warning("Sparrow SMS HTTP error for %s: %s", phone, exc)
            return False
        except Exception as exc:
            logger.exception("Sparrow SMS unexpected error for %s: %s", phone, exc)
            return False


def send_otp_sms(phone: str, otp: str) -> bool:
    """
    Send OTP SMS for phone verification.
    If Sparrow SMS is not configured, prints OTP to console for dev/test use.

    Returns:
        True  — SMS sent (or printed in dev mode).
        False — empty phone number.
    """
    if not phone:
        logger.warning("send_otp_sms called with empty phone number")
        return False

    message = f"किसान बजार: तपाईंको OTP कोड {otp} हो। यो १० मिनेटमा म्याद सकिन्छ।"
    sms = SparrowSMS()

    if sms.is_configured():
        return sms.send_sms(phone, message)

    # Dev mode: print to console instead of sending real SMS
    print(f"[DEV OTP] Phone: {phone} | OTP: {otp}")
    logger.info("[DEV OTP] Phone: %s | OTP: %s", phone, otp)
    return True


def build_price_alert_sms(crop_nepali: str, avg_price, threshold: str) -> str:
    """
    Build the standard Nepali price-alert SMS message.
    Kept short to fit in one SMS credit (≤ 160 chars).

    Format:
        किसान बजार: आलु को मूल्य रु.20.00 पुग्यो।
        आपको alert threshold रु.25.00 थियो।
    """
    return (
        f"किसान बजार: {crop_nepali} को मूल्य रु.{avg_price} पुग्यो। "
        f"आपको alert threshold रु.{threshold} थियो।"
    )
