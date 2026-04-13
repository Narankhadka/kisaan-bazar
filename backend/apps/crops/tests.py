from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Crop


def _make_crop(name_nepali, name_english, **kwargs):
    return Crop.objects.create(
        name_nepali=name_nepali,
        name_english=name_english,
        unit=kwargs.get("unit", "kg"),
        category=kwargs.get("category", "VEGETABLE"),
        is_active=kwargs.get("is_active", True),
    )


class CropListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        _make_crop("आलु", "Potato", unit="kg", category="VEGETABLE")
        _make_crop("टमाटर", "Tomato", unit="kg", category="VEGETABLE")

    def test_list_crops(self):
        resp = self.client.get(reverse("crop-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

    def test_list_is_public_no_auth_required(self):
        """Unauthenticated users can browse crops."""
        resp = self.client.get(reverse("crop-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_inactive_crop_excluded_from_list(self):
        _make_crop("काउली", "Cauliflower", is_active=False)
        resp = self.client.get(reverse("crop-list"))
        self.assertEqual(resp.data["count"], 2)   # inactive crop not included


class CropDetailTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.crop = _make_crop("आलु", "Potato")

    def test_detail_is_public(self):
        resp = self.client.get(reverse("crop-detail", kwargs={"pk": self.crop.pk}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name_english"], "Potato")

    def test_inactive_crop_returns_404(self):
        inactive = _make_crop("काउली", "Cauliflower", is_active=False)
        resp = self.client.get(reverse("crop-detail", kwargs={"pk": inactive.pk}))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
