"""
Price alert checker.
Called after each scrape run to notify users whose threshold conditions are met.
Uses SparrowSMS for SMS delivery and Django's send_mail for email.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from apps.alerts.sms import SparrowSMS, build_price_alert_sms

logger = logging.getLogger(__name__)

_sms = SparrowSMS()   # one shared instance (stateless, just holds the token)


def check_price_alerts() -> int:
    """
    Evaluate all active PriceAlerts against today's prices.
    Sends SMS and/or email for every triggered alert.
    Returns the count of alerts that fired.
    """
    from apps.alerts.models import PriceAlert
    from apps.prices.models import DailyPrice

    today = timezone.localdate()
    alerts = PriceAlert.objects.filter(is_active=True).select_related("user", "crop")
    triggered = 0

    for alert in alerts:
        price = (
            DailyPrice.objects
            .filter(crop=alert.crop, date=today)
            .first()
        )
        if price is None:
            continue

        condition_met = (
            (alert.condition == "ABOVE" and price.avg_price > alert.threshold_price)
            or
            (alert.condition == "BELOW" and price.avg_price < alert.threshold_price)
        )
        if not condition_met:
            continue

        triggered += 1
        logger.info(
            "Alert triggered — user=%s crop=%s avg=रू%s threshold=रू%s cond=%s",
            alert.user.username,
            alert.crop.name_nepali,
            price.avg_price,
            alert.threshold_price,
            alert.condition,
        )

        sms_text = build_price_alert_sms(
            alert.crop.name_nepali,
            price.avg_price,
            alert.threshold_price,
        )

        if alert.via_sms and alert.user.phone:
            _sms.send_sms(alert.user.phone, sms_text)

        if alert.via_email and alert.user.email:
            _send_email(alert, sms_text)

    return triggered


def _send_email(alert, message: str) -> None:
    try:
        send_mail(
            subject=f"[किसान बजार] {alert.crop.name_nepali} मूल्य सूचना",
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[alert.user.email],
            fail_silently=True,
        )
        logger.info("Email alert sent to %s", alert.user.email)
    except Exception as exc:
        logger.warning("Email alert failed for %s: %s", alert.user.email, exc)
