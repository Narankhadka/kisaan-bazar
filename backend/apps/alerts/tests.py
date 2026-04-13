"""
Tests for the alerts app.
Covers: alert CRUD, SparrowSMS service, alert trigger logic, test-sms endpoint.
"""
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.crops.models import Crop
from apps.prices.models import DailyPrice
from apps.users.models import User

from .models import PriceAlert
from .sms import SparrowSMS, build_price_alert_sms


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(username, role="FARMER", phone="9800000001", is_staff=False):
    u = User.objects.create_user(
        username=username,
        password="pass1234",
        role=role,
        phone=phone,
        email=f"{username}@test.com",
    )
    if is_staff:
        u.is_staff = True
        u.save()
    return u


def _make_crop(name_nepali="आलु", name_english="Potato"):
    crop, _ = Crop.objects.get_or_create(
        name_nepali=name_nepali,
        defaults={"name_english": name_english, "unit": "kg", "category": "VEGETABLE"},
    )
    return crop


# ---------------------------------------------------------------------------
# 1. Alert CRUD
# ---------------------------------------------------------------------------

class AlertCRUDTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = _make_user("ram")
        self.crop = _make_crop()
        self.client.force_authenticate(user=self.user)

    def test_create_alert(self):
        resp = self.client.post(reverse("alert-list"), {
            "crop": self.crop.id,
            "threshold_price": "50.00",
            "condition": "BELOW",
            "via_sms": True,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PriceAlert.objects.count(), 1)

    def test_list_returns_only_own_alerts(self):
        other = _make_user("sita", phone="9800000002")
        PriceAlert.objects.create(user=self.user, crop=self.crop, threshold_price=50, condition="BELOW")
        PriceAlert.objects.create(user=other,     crop=self.crop, threshold_price=60, condition="ABOVE")

        resp = self.client.get(reverse("alert-list"))
        self.assertEqual(len(resp.data["results"]), 1)

    def test_soft_delete(self):
        alert = PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=50, condition="BELOW",
        )
        resp = self.client.delete(reverse("alert-delete", kwargs={"pk": alert.pk}))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        alert.refresh_from_db()
        self.assertFalse(alert.is_active)   # still in DB, just deactivated
        self.assertEqual(PriceAlert.objects.count(), 1)

    def test_unauthenticated_cannot_create(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse("alert-list"), {
            "crop": self.crop.id, "threshold_price": "30", "condition": "BELOW",
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# 2. SparrowSMS service
# ---------------------------------------------------------------------------

class SparrowSMSTest(TestCase):

    @override_settings(SPARROW_SMS_TOKEN="test-token-123")
    def test_send_sms_success(self):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {
            "response_code": 200,
            "message": "SMS Sent Successfully!",
            "credits_remaining": 99,
        }

        with patch("apps.alerts.sms.requests.post", return_value=mock_resp) as mock_post:
            sms  = SparrowSMS()
            sent = sms.send_sms("9800000001", "Test message")

        self.assertTrue(sent)
        mock_post.assert_called_once_with(
            "https://api.sparrowsms.com/v2/sms/",
            json={
                "token": "test-token-123",
                "from":  "KisanBazar",
                "to":    "9800000001",
                "text":  "Test message",
            },
            timeout=10,
        )

    @override_settings(SPARROW_SMS_TOKEN="test-token-123")
    def test_api_rejection_returns_false(self):
        """Sparrow returns HTTP 200 but response_code != 200 (e.g. invalid token)."""
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {"response_code": 403, "message": "Invalid token"}

        with patch("apps.alerts.sms.requests.post", return_value=mock_resp):
            sent = SparrowSMS().send_sms("9800000001", "Test")

        self.assertFalse(sent)

    @override_settings(SPARROW_SMS_TOKEN="test-token-123")
    def test_network_timeout_returns_false_no_raise(self):
        import requests as req_lib
        with patch("apps.alerts.sms.requests.post", side_effect=req_lib.Timeout):
            sent = SparrowSMS().send_sms("9800000001", "Test")

        self.assertFalse(sent)  # must not propagate the exception

    @override_settings(SPARROW_SMS_TOKEN="your-sparrow-token")
    def test_placeholder_token_skips_network(self):
        with patch("apps.alerts.sms.requests.post") as mock_post:
            sent = SparrowSMS().send_sms("9800000001", "Test")

        self.assertFalse(sent)
        mock_post.assert_not_called()

    @override_settings(SPARROW_SMS_TOKEN="")
    def test_empty_token_skips_network(self):
        with patch("apps.alerts.sms.requests.post") as mock_post:
            sent = SparrowSMS().send_sms("9800000001", "Test")

        self.assertFalse(sent)
        mock_post.assert_not_called()

    @override_settings(SPARROW_SMS_TOKEN="valid-token")
    def test_empty_phone_returns_false_no_network(self):
        with patch("apps.alerts.sms.requests.post") as mock_post:
            sent = SparrowSMS().send_sms("", "Test")

        self.assertFalse(sent)
        mock_post.assert_not_called()


# ---------------------------------------------------------------------------
# 3. SMS message format
# ---------------------------------------------------------------------------

class SMSMessageFormatTest(TestCase):

    def test_contains_required_fields(self):
        msg = build_price_alert_sms("आलु", Decimal("20.00"), "25.00")
        self.assertIn("किसान बजार", msg)
        self.assertIn("आलु", msg)
        self.assertIn("20.00", msg)
        self.assertIn("25.00", msg)

    def test_fits_single_sms_credit(self):
        """Standard messages must fit in one SMS credit (≤ 160 chars)."""
        msg = build_price_alert_sms("गोलभेंडा", Decimal("65.00"), "50.00")
        self.assertLessEqual(
            len(msg), 160,
            f"SMS too long ({len(msg)} chars): {msg}",
        )


# ---------------------------------------------------------------------------
# 4. Alert trigger logic (check_price_alerts)
# ---------------------------------------------------------------------------

class AlertTriggerTest(TestCase):

    def setUp(self):
        from django.utils import timezone
        self.user  = _make_user("hari", phone="9811111111")
        self.crop  = _make_crop("गोलभेंडा", "Tomato")
        self.today = timezone.localdate()
        # avg = (40 + 60) / 2 = 50
        DailyPrice.objects.create(
            crop=self.crop, date=self.today,
            min_price=40, max_price=60, source="KALIMATI",
        )

    @override_settings(SPARROW_SMS_TOKEN="test-token")
    def test_below_alert_fires_sms_when_price_is_low(self):
        """avg(50) < threshold(60) → BELOW alert fires."""
        PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=Decimal("60.00"),
            condition="BELOW",
            via_sms=True,
        )
        with patch("apps.scraper.alert_checker._sms") as mock_sms:
            from apps.scraper.alert_checker import check_price_alerts
            count = check_price_alerts()

        self.assertEqual(count, 1)
        mock_sms.send_sms.assert_called_once()
        phone_used = mock_sms.send_sms.call_args[0][0]
        self.assertEqual(phone_used, self.user.phone)

    @override_settings(SPARROW_SMS_TOKEN="test-token")
    def test_above_alert_fires_when_price_exceeds_threshold(self):
        """avg(50) > threshold(40) → ABOVE alert fires."""
        PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=Decimal("40.00"),
            condition="ABOVE",
            via_sms=True,
        )
        with patch("apps.scraper.alert_checker._sms") as mock_sms:
            from apps.scraper.alert_checker import check_price_alerts
            count = check_price_alerts()

        self.assertEqual(count, 1)
        mock_sms.send_sms.assert_called_once()

    def test_alert_does_not_fire_when_condition_not_met(self):
        """avg(50) is NOT below 30 → no trigger."""
        PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=Decimal("30.00"),
            condition="BELOW",
            via_sms=True,
        )
        with patch("apps.scraper.alert_checker._sms") as mock_sms:
            from apps.scraper.alert_checker import check_price_alerts
            count = check_price_alerts()

        self.assertEqual(count, 0)
        mock_sms.send_sms.assert_not_called()

    def test_inactive_alert_is_skipped(self):
        PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=Decimal("60.00"),
            condition="BELOW",
            via_sms=True,
            is_active=False,
        )
        with patch("apps.scraper.alert_checker._sms") as mock_sms:
            from apps.scraper.alert_checker import check_price_alerts
            count = check_price_alerts()

        self.assertEqual(count, 0)
        mock_sms.send_sms.assert_not_called()

    def test_via_sms_false_skips_sms_but_still_counts(self):
        """Alert is triggered logically but SMS is not dispatched."""
        PriceAlert.objects.create(
            user=self.user, crop=self.crop,
            threshold_price=Decimal("60.00"),
            condition="BELOW",
            via_sms=False,
        )
        with patch("apps.scraper.alert_checker._sms") as mock_sms:
            from apps.scraper.alert_checker import check_price_alerts
            count = check_price_alerts()

        self.assertEqual(count, 1)
        mock_sms.send_sms.assert_not_called()


# ---------------------------------------------------------------------------
# 5. POST /api/alerts/test-sms/ endpoint
# ---------------------------------------------------------------------------

class TestSMSEndpointTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin  = _make_user("admin_user",  is_staff=True)
        self.farmer = _make_user("farmer_user", phone="9800000002")

    def test_non_admin_gets_403(self):
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("alert-test-sms"), {"phone": "9800000001"})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_gets_401(self):
        resp = self.client.post(reverse("alert-test-sms"), {"phone": "9800000001"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_phone_returns_400(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(reverse("alert-test-sms"), {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(SPARROW_SMS_TOKEN="your-sparrow-token")
    def test_unconfigured_token_returns_503(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(reverse("alert-test-sms"), {"phone": "9800000001"})
        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("SPARROW_SMS_TOKEN", resp.data["error"])

    @override_settings(SPARROW_SMS_TOKEN="valid-token")
    def test_successful_send_returns_200(self):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {"response_code": 200, "credits_remaining": 50}

        self.client.force_authenticate(user=self.admin)
        with patch("apps.alerts.sms.requests.post", return_value=mock_resp):
            resp = self.client.post(
                reverse("alert-test-sms"),
                {"phone": "9800000001"},
            )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "sent")
        self.assertEqual(resp.data["phone"], "9800000001")

    @override_settings(SPARROW_SMS_TOKEN="valid-token")
    def test_api_failure_returns_502(self):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {"response_code": 403, "message": "Invalid token"}

        self.client.force_authenticate(user=self.admin)
        with patch("apps.alerts.sms.requests.post", return_value=mock_resp):
            resp = self.client.post(
                reverse("alert-test-sms"),
                {"phone": "9800000001"},
            )

        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)

    @override_settings(SPARROW_SMS_TOKEN="valid-token")
    def test_custom_message_is_forwarded(self):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        mock_resp.json.return_value = {"response_code": 200, "credits_remaining": 50}

        self.client.force_authenticate(user=self.admin)
        with patch("apps.alerts.sms.requests.post", return_value=mock_resp) as mock_post:
            self.client.post(
                reverse("alert-test-sms"),
                {"phone": "9800000001", "message": "Custom test text"},
            )

        payload = mock_post.call_args[1]["json"]
        self.assertEqual(payload["text"], "Custom test text")
