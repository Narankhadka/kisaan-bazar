from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.crops.models import Crop
from apps.listings.models import Listing
from apps.users.models import User

from .models import Order


def _make_user(username, role):
    return User.objects.create_user(
        username=username, password="pass1234", role=role,
        email=f"{username}@test.com",
    )


class OrderTest(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.farmer  = _make_user("ram",  "FARMER")
        self.buyer   = _make_user("sita", "BUYER")
        self.buyer2  = _make_user("gita", "BUYER")
        crop = Crop.objects.create(name_nepali="आलु", name_english="Potato", unit="kg")
        self.listing = Listing.objects.create(
            farmer=self.farmer, crop=crop,
            quantity_kg=100, asking_price=45, district="Kathmandu",
        )

    def _place_order(self, user=None, listing=None, qty="10.00"):
        buyer = user or self.buyer
        self.client.force_authenticate(user=buyer)
        resp = self.client.post(reverse("order-create"), {
            "listing":    (listing or self.listing).id,
            "quantity_kg": qty,
            "message":    "I need potatoes",
        })
        self.client.force_authenticate(user=None)
        return resp

    # --- create ---

    def test_buyer_can_place_order(self):
        resp = self._place_order()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_farmer_cannot_place_order(self):
        """FARMER role must be blocked from creating orders."""
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("order-create"), {
            "listing": self.listing.id, "quantity_kg": "5.00",
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_place_order(self):
        resp = self.client.post(reverse("order-create"), {
            "listing": self.listing.id, "quantity_kg": "5.00",
        })
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # --- status update ---

    def test_farmer_can_accept_order(self):
        order = Order.objects.create(buyer=self.buyer, listing=self.listing, quantity_kg=10)
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.patch(
            reverse("order-status", kwargs={"pk": order.id}),
            {"status": "ACCEPTED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_farmer_can_reject_order(self):
        order = Order.objects.create(buyer=self.buyer, listing=self.listing, quantity_kg=10)
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.patch(
            reverse("order-status", kwargs={"pk": order.id}),
            {"status": "REJECTED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "REJECTED")

    def test_buyer_cannot_update_order_status(self):
        """Buyers must not be able to accept/reject orders — that is the farmer's role."""
        order = Order.objects.create(buyer=self.buyer, listing=self.listing, quantity_kg=10)
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.patch(
            reverse("order-status", kwargs={"pk": order.id}),
            {"status": "ACCEPTED"},
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # --- my orders ---

    def test_buyer_my_orders_shows_own_only(self):
        Order.objects.create(buyer=self.buyer,  listing=self.listing, quantity_kg=10)
        Order.objects.create(buyer=self.buyer2, listing=self.listing, quantity_kg=5)

        self.client.force_authenticate(user=self.buyer)
        resp = self.client.get(reverse("order-my"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_farmer_my_orders_shows_orders_on_their_listings(self):
        """Farmers see incoming orders for their listings."""
        Order.objects.create(buyer=self.buyer,  listing=self.listing, quantity_kg=10)
        Order.objects.create(buyer=self.buyer2, listing=self.listing, quantity_kg=5)

        self.client.force_authenticate(user=self.farmer)
        resp = self.client.get(reverse("order-my"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)
