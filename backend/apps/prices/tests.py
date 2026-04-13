from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.crops.models import Crop

from .models import DailyPrice


def _make_crop():
    crop, _ = Crop.objects.get_or_create(
        name_nepali="आलु",
        defaults={"name_english": "Potato", "unit": "kg", "category": "VEGETABLE"},
    )
    return crop


class TodayPriceTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.crop = _make_crop()
        self.today = timezone.localdate()
        DailyPrice.objects.create(
            crop=self.crop, date=self.today,
            min_price=40, max_price=60,
        )

    def test_today_prices_public(self):
        resp = self.client.get(reverse("price-today"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_filter_by_crop(self):
        resp = self.client.get(reverse("price-today") + "?crop=आलु")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_avg_price_auto_calculated(self):
        price = DailyPrice.objects.get(crop=self.crop)
        self.assertEqual(price.avg_price, 50)

    def test_today_endpoint_returns_only_todays_date(self):
        """Yesterday's price must not appear on the today endpoint."""
        yesterday = self.today - timedelta(days=1)
        DailyPrice.objects.create(
            crop=self.crop, date=yesterday,
            min_price=30, max_price=50,
        )
        resp = self.client.get(reverse("price-today"))
        self.assertEqual(resp.data["count"], 1)   # still 1, not 2

    def test_date_filter_returns_historical_price(self):
        """?date= param overrides today and returns the correct day's data."""
        yesterday = self.today - timedelta(days=1)
        DailyPrice.objects.create(
            crop=self.crop, date=yesterday,
            min_price=20, max_price=40,
        )
        resp = self.client.get(
            reverse("price-today") + f"?date={yesterday.isoformat()}"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["avg_price"], "30.00")


class PriceHistoryTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.crop = _make_crop()
        today = timezone.localdate()
        for i in range(5):
            DailyPrice.objects.create(
                crop=self.crop,
                date=today - timedelta(days=i),
                min_price=40, max_price=60,
            )

    def test_history_returns_last_30_days(self):
        resp = self.client.get(reverse("price-history", kwargs={"crop_id": self.crop.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 5)

    def test_history_is_public(self):
        resp = self.client.get(reverse("price-history", kwargs={"crop_id": self.crop.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class TrendingPriceTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        today = timezone.localdate()
        for i in range(3):
            crop = Crop.objects.create(
                name_nepali=f"crop_{i}",
                name_english=f"Crop {i}",
                unit="kg",
                category="VEGETABLE",
            )
            DailyPrice.objects.create(
                crop=crop, date=today,
                min_price=10 * (i + 1), max_price=20 * (i + 1),
            )

    def test_trending_is_public(self):
        resp = self.client.get(reverse("price-trending"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_trending_ordered_by_avg_price_descending(self):
        resp = self.client.get(reverse("price-trending"))
        prices = [float(item["avg_price"]) for item in resp.data]
        self.assertEqual(prices, sorted(prices, reverse=True))
