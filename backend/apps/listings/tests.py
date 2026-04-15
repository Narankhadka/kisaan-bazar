from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.crops.models import Crop
from apps.users.models import User

from .models import Listing


def _make_user(username, role, **kwargs):
    return User.objects.create_user(
        username=username, password="pass1234", role=role,
        email=f"{username}@test.com", **kwargs
    )


def _make_crop():
    crop, _ = Crop.objects.get_or_create(
        name_nepali="आलु",
        defaults={"name_english": "Potato", "unit": "kg", "category": "VEGETABLE"},
    )
    return crop


class ListingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = _make_user("ram", "FARMER", district="काठमाडौं")
        self.buyer  = _make_user("sita", "BUYER")
        self.crop   = _make_crop()

    def _create_listing(self):
        return Listing.objects.create(
            farmer=self.farmer, crop=self.crop,
            quantity_kg=100, asking_price=45, district="काठमाडौं",
        )

    # --- visibility ---

    def test_public_can_view_listings(self):
        resp = self.client.get(reverse("listing-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # --- create ---

    def test_farmer_can_create_listing(self):
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("listing-list"), {
            "crop_id":      self.crop.id,
            "quantity_kg":  "100.00",
            "asking_price": "45.00",
            "district":     "काठमाडौं",
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_buyer_cannot_create_listing(self):
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("listing-list"), {})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_listing(self):
        resp = self.client.post(reverse("listing-list"), {
            "crop_id": self.crop.id, "quantity_kg": "10", "asking_price": "40", "district": "Lalitpur",
        })
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # --- soft delete ---

    def test_soft_delete_deactivates_listing(self):
        listing = self._create_listing()
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.delete(reverse("listing-detail", kwargs={"pk": listing.pk}))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        listing.refresh_from_db()
        self.assertFalse(listing.is_active)
        self.assertEqual(Listing.objects.count(), 1)   # still in DB

    def test_soft_deleted_listing_hidden_from_public_list(self):
        listing = self._create_listing()
        listing.is_active = False
        listing.save()
        resp = self.client.get(reverse("listing-list"))
        self.assertEqual(resp.data["count"], 0)

    # --- filters ---

    def test_filter_by_district(self):
        self._create_listing()
        Listing.objects.create(
            farmer=self.farmer, crop=self.crop,
            quantity_kg=50, asking_price=40, district="कास्की",
        )
        resp = self.client.get(reverse("listing-list") + "?district=काठमाडौं")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["district"], "काठमाडौं")

    def test_filter_by_crop(self):
        self._create_listing()
        other_crop = Crop.objects.create(
            name_nepali="टमाटर", name_english="Tomato",
            unit="kg", category="VEGETABLE",
        )
        Listing.objects.create(
            farmer=self.farmer, crop=other_crop,
            quantity_kg=30, asking_price=35, district="Kathmandu",
        )
        resp = self.client.get(reverse("listing-list") + "?crop=आलु")
        self.assertEqual(resp.data["count"], 1)

    # --- my listings ---

    def test_my_listings_returns_only_own(self):
        farmer2 = _make_user("hari", "FARMER", district="काठमाडौं")
        self._create_listing()
        Listing.objects.create(
            farmer=farmer2, crop=self.crop,
            quantity_kg=50, asking_price=50, district="काठमाडौं",
        )
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.get(reverse("listing-my"))
        self.assertEqual(resp.data["count"], 1)

    # --- ownership & permissions ---

    def test_farmer_cannot_edit_another_farmers_listing(self):
        """A farmer must not be able to edit listings they don't own."""
        farmer2 = _make_user("hari", "FARMER")
        listing = self._create_listing()   # owned by self.farmer
        self.client.force_authenticate(user=farmer2)
        resp = self.client.patch(
            reverse("listing-detail", kwargs={"pk": listing.pk}),
            {"asking_price": "10.00"},
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_farmer_cannot_delete_another_farmers_listing(self):
        farmer2 = _make_user("hari2", "FARMER")
        listing = self._create_listing()
        self.client.force_authenticate(user=farmer2)
        resp = self.client.delete(
            reverse("listing-detail", kwargs={"pk": listing.pk})
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        listing.refresh_from_db()
        self.assertTrue(listing.is_active)   # untouched

    def test_negative_price_rejected(self):
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("listing-list"), {
            "crop_id":      self.crop.id,
            "quantity_kg":  "50.00",
            "asking_price": "-5.00",
            "district":     "काठमाडौं",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("asking_price", resp.data)

    def test_zero_quantity_rejected(self):
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("listing-list"), {
            "crop_id":      self.crop.id,
            "quantity_kg":  "0",
            "asking_price": "40.00",
            "district":     "काठमाडौं",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity_kg", resp.data)

    def test_invalid_district_rejected(self):
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("listing-list"), {
            "crop_id":      self.crop.id,
            "quantity_kg":  "50.00",
            "asking_price": "40.00",
            "district":     "Mumbai",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("district", resp.data)
