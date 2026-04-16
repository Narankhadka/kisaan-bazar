import base64
import hashlib
import hmac
import json
import uuid as uuid_module
from decimal import Decimal

import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderSerializer, OrderStatusSerializer


def _esewa_signature(total_amount_str, transaction_uuid, product_code):
    """Compute HMAC-SHA256 signature for eSewa v2 API.

    eSewa requires the message to be exactly:
      total_amount={v},transaction_uuid={v},product_code={v}
    No spaces. signed_field_names order must match exactly.
    """
    message = (
        f"total_amount={total_amount_str},"
        f"transaction_uuid={transaction_uuid},"
        f"product_code={product_code}"
    )
    secret = settings.ESEWA_SECRET_KEY
    sig = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256,
    ).digest()
    signature = base64.b64encode(sig).decode('utf-8')

    # Debug — remove before production
    print(f"[eSewa] Secret (first 4): {secret[:4]}...")
    print(f"[eSewa] Message: {message}")
    print(f"[eSewa] Signature: {signature}")

    return signature


class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "BUYER"


class OrderCreateView(generics.CreateAPIView):
    """POST /api/orders/"""
    serializer_class = OrderSerializer
    permission_classes = (IsBuyer,)

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)


class MyOrderListView(generics.ListAPIView):
    """GET /api/orders/my/"""
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == "BUYER":
            return Order.objects.filter(buyer=user, is_active=True)
        # Farmer sees orders on their listings
        return Order.objects.filter(listing__farmer=user, is_active=True)


class IsFarmer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "FARMER"


class OrderStatusUpdateView(generics.UpdateAPIView):
    """PATCH /api/orders/<id>/status/ — farmer accepts/rejects"""
    serializer_class = OrderStatusSerializer
    permission_classes = (IsFarmer,)
    http_method_names = ["patch"]

    def get_queryset(self):
        return Order.objects.filter(listing__farmer=self.request.user, is_active=True)


class BuyerCancelOrderView(APIView):
    """DELETE /api/orders/<id>/ — buyer cancels a PENDING order (soft delete)"""
    permission_classes = (IsBuyer,)

    def delete(self, request, pk):
        order = generics.get_object_or_404(
            Order, pk=pk, buyer=request.user, status=Order.Status.PENDING, is_active=True
        )
        order.is_active = False
        order.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiatePaymentView(APIView):
    """POST /api/orders/<id>/initiate-payment/ — returns eSewa form fields"""
    permission_classes = (IsBuyer,)

    def post(self, request, pk):
        order = generics.get_object_or_404(
            Order, pk=pk, buyer=request.user, is_active=True
        )
        if order.status != Order.Status.ACCEPTED:
            return Response(
                {"detail": "Order must be ACCEPTED before payment."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if order.payment_status == Order.PaymentStatus.PAID:
            return Response(
                {"detail": "Order is already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_amount = (
            Decimal(str(order.quantity_kg)) * Decimal(str(order.listing.asking_price))
        )
        # Explicit 2-decimal string — eSewa requires "150.00" not "150" or "150.0"
        total_amount_str = f"{raw_amount:.2f}"

        transaction_uuid = str(uuid_module.uuid4())
        product_code     = settings.ESEWA_MERCHANT_ID
        signature        = _esewa_signature(total_amount_str, transaction_uuid, product_code)

        # Store uuid on order so we can match it during verification
        order.esewa_transaction_id = transaction_uuid
        order.payment_method       = Order.PaymentMethod.ESEWA
        order.save(update_fields=["esewa_transaction_id", "payment_method"])

        return Response({
            "esewa_url":               f"{settings.ESEWA_URL}/api/epay/main/v2/form",
            "amount":                  total_amount_str,
            "tax_amount":              "0",
            "total_amount":            total_amount_str,
            "transaction_uuid":        transaction_uuid,
            "product_code":            product_code,
            "product_service_charge":  "0",
            "product_delivery_charge": "0",
            "success_url":             settings.ESEWA_SUCCESS_URL,
            "failure_url":             settings.ESEWA_FAILURE_URL,
            "signed_field_names":      "total_amount,transaction_uuid,product_code",
            "signature":               signature,
        })


class VerifyPaymentView(APIView):
    """POST /api/orders/verify-payment/ — verifies eSewa callback data"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        encoded_data = request.data.get("data", "")
        if not encoded_data:
            return Response({"detail": "Missing data parameter."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = base64.b64decode(encoded_data).decode("utf-8")
            payload = json.loads(decoded)
        except Exception:
            return Response({"detail": "Invalid payment data."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify signature
        signed_fields = payload.get("signed_field_names", "").split(",")
        message_parts = [f"{f}={payload.get(f, '')}" for f in signed_fields]
        message       = ",".join(message_parts)
        expected_sig  = base64.b64encode(
            hmac.new(
                settings.ESEWA_SECRET_KEY.encode(),
                message.encode(),
                hashlib.sha256,
            ).digest()
        ).decode()

        if payload.get("signature") != expected_sig:
            return Response({"detail": "Signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        transaction_uuid = payload.get("transaction_uuid", "")
        total_amount     = payload.get("total_amount", "")
        product_code     = payload.get("product_code", settings.ESEWA_MERCHANT_ID)

        # Confirm with eSewa status API
        try:
            esewa_resp = requests.get(
                f"{settings.ESEWA_URL}/api/epay/transaction/status/",
                params={
                    "product_code":     product_code,
                    "total_amount":     total_amount,
                    "transaction_uuid": transaction_uuid,
                },
                timeout=10,
            )
            esewa_data = esewa_resp.json()
        except Exception:
            return Response({"detail": "Could not reach eSewa to verify payment."}, status=status.HTTP_502_BAD_GATEWAY)

        if esewa_data.get("status") != "COMPLETE":
            # Mark as failed if we have an order for this UUID
            Order.objects.filter(esewa_transaction_id=transaction_uuid).update(
                payment_status=Order.PaymentStatus.FAILED
            )
            return Response(
                {"detail": "Payment not completed.", "esewa_status": esewa_data.get("status")},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Payment confirmed — update order
        ref_id = esewa_data.get("ref_id") or payload.get("transaction_code", "")
        try:
            order = Order.objects.get(esewa_transaction_id=transaction_uuid, buyer=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found for this transaction."}, status=status.HTTP_404_NOT_FOUND)

        order.payment_status  = Order.PaymentStatus.PAID
        order.esewa_ref_id    = ref_id
        order.amount_paid     = Decimal(str(total_amount).replace(",", ""))
        order.save(update_fields=["payment_status", "esewa_ref_id", "amount_paid"])

        return Response({
            "status":           "PAID",
            "order_id":         order.id,
            "ref_id":           ref_id,
            "amount_paid":      str(order.amount_paid),
            "crop_name":        order.listing.crop.name_nepali,
            "farmer_name":      order.listing.farmer.username,
        })
