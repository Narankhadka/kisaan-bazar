"""
Tests for admin panel API endpoints.
"""
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.crops.models import Crop
from apps.listings.models import Listing
from apps.orders.models import Order
from apps.prices.models import DailyPrice
from apps.scraper.models import ScraperLog
from apps.users.models import User


# ── Helpers ───────────────────────────────────────────────────────────────────

def _auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


def _make_user(role, username):
    return User.objects.create_user(
        username=username, password="pass1234", role=role
    )


def _make_crop(name="আলু"):
    return Crop.objects.get_or_create(
        name_nepali=name,
        defaults={"name_english": "Potato", "unit": "kg", "category": "VEGETABLE"},
    )[0]


# ── Base ──────────────────────────────────────────────────────────────────────

class AdminAPIBase(APITestCase):
    def setUp(self):
        self.admin  = _make_user("ADMIN",  "admin_user")
        self.farmer = _make_user("FARMER", "farmer_user")
        self.buyer  = _make_user("BUYER",  "buyer_user")
        self.crop   = _make_crop()


# ── Stats ─────────────────────────────────────────────────────────────────────

class AdminStatsTests(AdminAPIBase):
    URL = "/api/admin/stats/"

    def test_admin_can_get_stats(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        for key in ("total_users", "total_farmers", "total_buyers",
                    "total_listings", "total_orders", "today_prices",
                    "pending_orders", "pending_verifications"):
            self.assertIn(key, r.data)

    def test_farmer_cannot_get_stats(self):
        _auth(self.client, self.farmer)
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_403_FORBIDDEN)

    def test_buyer_cannot_get_stats(self):
        _auth(self.client, self.buyer)
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_get_stats(self):
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_401_UNAUTHORIZED)


# ── Users ─────────────────────────────────────────────────────────────────────

class AdminUserListTests(AdminAPIBase):
    URL = "/api/admin/users/"

    def test_admin_can_list_users(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertIn("results", r.data)
        self.assertGreaterEqual(len(r.data["results"]), 3)

    def test_filter_by_role(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL, {"role": "FARMER"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        for u in r.data["results"]:
            self.assertEqual(u["role"], "FARMER")

    def test_search_by_username(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL, {"search": "farmer_user"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.data["results"]), 1)
        self.assertEqual(r.data["results"][0]["username"], "farmer_user")

    def test_non_admin_forbidden(self):
        _auth(self.client, self.farmer)
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_403_FORBIDDEN)


class AdminUserVerifyTests(AdminAPIBase):
    def _url(self, pk):
        return f"/api/admin/users/{pk}/verify/"

    def test_admin_can_verify_farmer(self):
        _auth(self.client, self.admin)
        self.assertFalse(self.farmer.is_id_verified)
        r = self.client.patch(self._url(self.farmer.pk), {'action': 'verify'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertTrue(r.data["is_id_verified"])
        self.farmer.refresh_from_db()
        self.assertTrue(self.farmer.is_id_verified)

    def test_admin_can_reject_farmer(self):
        _auth(self.client, self.admin)
        self.farmer.is_id_verified = True
        self.farmer.save()
        r = self.client.patch(self._url(self.farmer.pk), {'action': 'reject'}, format='json')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertFalse(r.data["is_id_verified"])
        self.farmer.refresh_from_db()
        self.assertFalse(self.farmer.is_id_verified)

    def test_returns_404_for_missing_user(self):
        _auth(self.client, self.admin)
        self.assertEqual(self.client.patch(self._url(99999)).status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_forbidden(self):
        _auth(self.client, self.buyer)
        self.assertEqual(self.client.patch(self._url(self.farmer.pk)).status_code, status.HTTP_403_FORBIDDEN)

    def test_pending_verification_filter(self):
        _auth(self.client, self.admin)
        # farmer_user is unverified; add a verified farmer
        verified_farmer = _make_user("FARMER", "verified_farmer")
        verified_farmer.is_id_verified = True
        verified_farmer.save()
        r = self.client.get("/api/admin/users/", {"pending_verification": "true"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        usernames = [u["username"] for u in r.data["results"]]
        self.assertIn("farmer_user", usernames)
        self.assertNotIn("verified_farmer", usernames)

    def test_admin_user_list_exposes_id_fields(self):
        _auth(self.client, self.admin)
        r = self.client.get("/api/admin/users/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        first = next(u for u in r.data["results"] if u["username"] == "farmer_user")
        for field in ("id_type", "id_number", "id_front_photo", "id_back_photo", "is_id_verified"):
            self.assertIn(field, first)


# ── Listings ──────────────────────────────────────────────────────────────────

class AdminListingTests(AdminAPIBase):
    LIST_URL = "/api/admin/listings/"

    def _delete_url(self, pk):
        return f"/api/admin/listings/{pk}/"

    def setUp(self):
        super().setUp()
        self.listing = Listing.objects.create(
            farmer=self.farmer, crop=self.crop,
            quantity_kg=100, asking_price=50, district="काठमाडौं",
        )

    def test_admin_can_list_all_listings(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.LIST_URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data["results"]), 1)

    def test_filter_active(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.LIST_URL, {"is_active": "true"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_hard_delete_listing(self):
        _auth(self.client, self.admin)
        r = self.client.delete(self._delete_url(self.listing.pk))
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Listing.objects.filter(pk=self.listing.pk).exists())

    def test_delete_nonexistent_returns_404(self):
        _auth(self.client, self.admin)
        self.assertEqual(self.client.delete(self._delete_url(99999)).status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_cannot_delete(self):
        _auth(self.client, self.farmer)
        self.assertEqual(self.client.delete(self._delete_url(self.listing.pk)).status_code, status.HTTP_403_FORBIDDEN)


# ── Orders ────────────────────────────────────────────────────────────────────

class AdminOrderTests(AdminAPIBase):
    URL = "/api/admin/orders/"

    def setUp(self):
        super().setUp()
        listing = Listing.objects.create(
            farmer=self.farmer, crop=self.crop,
            quantity_kg=200, asking_price=40, district="काठमाडौं",
        )
        Order.objects.create(buyer=self.buyer, listing=listing, quantity_kg=10)

    def test_admin_can_list_orders(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data["results"]), 1)

    def test_filter_by_status(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL, {"status": "PENDING"})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        for o in r.data["results"]:
            self.assertEqual(o["status"], "PENDING")

    def test_non_admin_forbidden(self):
        _auth(self.client, self.buyer)
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_403_FORBIDDEN)


# ── Prices ────────────────────────────────────────────────────────────────────

class AdminPriceTests(AdminAPIBase):
    URL = "/api/admin/prices/"

    def setUp(self):
        super().setUp()
        DailyPrice.objects.create(
            crop=self.crop, date=timezone.localdate(),
            min_price=30, max_price=50,
            source=DailyPrice.Source.KALIMATI,
        )

    def test_admin_can_list_prices(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data["results"]), 1)

    def test_filter_by_date(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL, {"date": str(timezone.localdate())})
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_admin_can_add_manual_price(self):
        crop2 = _make_crop("गोलभेडा")
        _auth(self.client, self.admin)
        r = self.client.post(self.URL, {
            "crop_id": crop2.pk,
            "date":      "2026-01-01",
            "min_price": "20.00",
            "max_price": "35.00",
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["source"], "MANUAL")

    def test_non_admin_cannot_add_price(self):
        _auth(self.client, self.farmer)
        r = self.client.post(self.URL, {
            "crop_id": self.crop.pk, "date": "2026-01-01",
            "min_price": "10.00", "max_price": "20.00",
        })
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


# ── Scraper Run ───────────────────────────────────────────────────────────────

class AdminScraperRunTests(AdminAPIBase):
    URL = "/api/admin/scraper/run/"

    @patch("apps.scraper.admin_views.threading.Thread")
    def test_admin_can_trigger_scraper(self, mock_thread):
        mock_thread.return_value.start.return_value = None
        _auth(self.client, self.admin)
        r = self.client.post(self.URL)
        self.assertEqual(r.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn("log_id", r.data)
        self.assertEqual(r.data["status"], "started")
        self.assertTrue(ScraperLog.objects.filter(pk=r.data["log_id"]).exists())

    @patch("apps.scraper.admin_views.threading.Thread")
    def test_daily_limit_enforced(self, mock_thread):
        mock_thread.return_value.start.return_value = None
        _auth(self.client, self.admin)
        for _ in range(3):
            ScraperLog.objects.create(triggered_by=self.admin)
        r = self.client.post(self.URL)
        self.assertEqual(r.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_non_admin_cannot_run_scraper(self):
        _auth(self.client, self.farmer)
        self.assertEqual(self.client.post(self.URL).status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_run_scraper(self):
        self.assertEqual(self.client.post(self.URL).status_code, status.HTTP_401_UNAUTHORIZED)


# ── Scraper Logs ──────────────────────────────────────────────────────────────

class AdminScraperLogTests(AdminAPIBase):
    URL = "/api/admin/scraper/logs/"

    def setUp(self):
        super().setUp()
        ScraperLog.objects.create(triggered_by=self.admin, status="SUCCESS", saved_count=42)
        ScraperLog.objects.create(triggered_by=None,       status="SUCCESS", saved_count=10)

    def test_admin_can_list_logs(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data["results"]), 2)

    def test_log_fields_present(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        first = r.data["results"][0]
        for field in ("id", "status", "triggered_by", "fetched_count",
                      "saved_count", "unmatched_count", "started_at"):
            self.assertIn(field, first)

    def test_scheduler_log_shows_scheduler(self):
        _auth(self.client, self.admin)
        r = self.client.get(self.URL)
        values = [item["triggered_by"] for item in r.data["results"]]
        self.assertIn("scheduler", values)

    def test_non_admin_forbidden(self):
        _auth(self.client, self.buyer)
        self.assertEqual(self.client.get(self.URL).status_code, status.HTTP_403_FORBIDDEN)
