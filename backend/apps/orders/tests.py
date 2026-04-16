import base64
import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.conf import settings
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


# ── Payment Tests ─────────────────────────────────────────────────────────────

def _make_esewa_sig(total_amount, transaction_uuid, product_code):
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    return base64.b64encode(
        hmac.new(
            settings.ESEWA_SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256,
        ).digest()
    ).decode()


class PaymentInitiateTest(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.farmer  = _make_user("ramP", "FARMER")
        self.buyer   = _make_user("sitaP", "BUYER")
        crop = Crop.objects.create(name_nepali="आलु", name_english="Potato", unit="kg")
        self.listing = Listing.objects.create(
            farmer=self.farmer, crop=crop,
            quantity_kg=100, asking_price=Decimal("45.00"), district="Kathmandu",
        )

    def _accepted_order(self):
        order = Order.objects.create(
            buyer=self.buyer, listing=self.listing,
            quantity_kg=Decimal("10.00"), status=Order.Status.ACCEPTED,
        )
        return order

    def test_initiate_payment_returns_esewa_fields(self):
        order = self._accepted_order()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for key in ("esewa_url", "total_amount", "transaction_uuid", "signature", "product_code"):
            self.assertIn(key, resp.data)

    def test_initiate_payment_total_is_qty_times_price(self):
        order = self._accepted_order()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # 10 kg * 45 = 450.00
        self.assertEqual(resp.data["total_amount"], "450.00")

    def test_initiate_payment_blocked_for_pending_order(self):
        order = Order.objects.create(
            buyer=self.buyer, listing=self.listing, quantity_kg=10,
            status=Order.Status.PENDING,
        )
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_initiate_payment_blocked_if_already_paid(self):
        order = self._accepted_order()
        order.payment_status = Order.PaymentStatus.PAID
        order.save()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_farmer_cannot_initiate_payment(self):
        order = self._accepted_order()
        self.client.force_authenticate(user=self.farmer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_signature_is_valid_hmac(self):
        order = self._accepted_order()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-initiate-payment", kwargs={"pk": order.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        expected = _make_esewa_sig(
            resp.data["total_amount"],
            resp.data["transaction_uuid"],
            resp.data["product_code"],
        )
        self.assertEqual(resp.data["signature"], expected)


class PaymentVerifyTest(TestCase):
    def setUp(self):
        self.client  = APIClient()
        self.farmer  = _make_user("ramV", "FARMER")
        self.buyer   = _make_user("sitaV", "BUYER")
        crop = Crop.objects.create(name_nepali="आलु", name_english="Potato", unit="kg")
        self.listing = Listing.objects.create(
            farmer=self.farmer, crop=crop,
            quantity_kg=100, asking_price=Decimal("45.00"), district="Kathmandu",
        )
        self.order = Order.objects.create(
            buyer=self.buyer, listing=self.listing,
            quantity_kg=Decimal("10.00"), status=Order.Status.ACCEPTED,
            esewa_transaction_id="test-uuid-1234",
            payment_method=Order.PaymentMethod.ESEWA,
        )

    def _build_data(self, transaction_uuid="test-uuid-1234", total_amount="450.00",
                    esewa_status="COMPLETE", ref_id="REF123"):
        product_code = settings.ESEWA_MERCHANT_ID
        signed_fields = "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names"
        payload = {
            "transaction_code":  ref_id,
            "status":            esewa_status,
            "total_amount":      total_amount,
            "transaction_uuid":  transaction_uuid,
            "product_code":      product_code,
            "signed_field_names": signed_fields,
        }
        # Build signature over signed_field_names
        message_parts = [f"{f}={payload[f]}" for f in signed_fields.split(",")]
        message = ",".join(message_parts)
        sig = base64.b64encode(
            hmac.new(
                settings.ESEWA_SECRET_KEY.encode(),
                message.encode(),
                hashlib.sha256,
            ).digest()
        ).decode()
        payload["signature"] = sig
        return base64.b64encode(json.dumps(payload).encode()).decode()

    @patch("apps.orders.views.requests.get")
    def test_verify_payment_marks_order_paid(self, mock_get):
        mock_get.return_value = MagicMock(
            json=lambda: {"status": "COMPLETE", "ref_id": "REF123"}
        )
        encoded = self._build_data()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-verify-payment"), {"data": encoded}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "PAID")
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PAID)

    @patch("apps.orders.views.requests.get")
    def test_verify_payment_fails_on_incomplete_status(self, mock_get):
        mock_get.return_value = MagicMock(
            json=lambda: {"status": "PENDING", "ref_id": ""}
        )
        encoded = self._build_data(esewa_status="PENDING")
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-verify-payment"), {"data": encoded}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.FAILED)

    def test_verify_payment_rejects_bad_signature(self):
        product_code = settings.ESEWA_MERCHANT_ID
        payload = {
            "transaction_code":   "REF999",
            "status":             "COMPLETE",
            "total_amount":       "450.00",
            "transaction_uuid":   "test-uuid-1234",
            "product_code":       product_code,
            "signed_field_names": "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
            "signature":          "BAD_SIGNATURE",
        }
        encoded = base64.b64encode(json.dumps(payload).encode()).decode()
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-verify-payment"), {"data": encoded}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_payment_rejects_missing_data(self):
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(reverse("order-verify-payment"), {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_payment_requires_auth(self):
        resp = self.client.post(reverse("order-verify-payment"), {"data": "abc"}, format="json")
        self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
