from django.db import models
from django.conf import settings
from apps.listings.models import Listing


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        COMPLETED = "COMPLETED", "Completed"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PAID   = "PAID",   "Paid"
        FAILED = "FAILED", "Failed"

    class PaymentMethod(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ESEWA   = "ESEWA",   "eSewa"
        CASH    = "CASH",    "Cash"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="orders", limit_choices_to={"role": "BUYER"}
    )
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="orders")
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    message = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)   # soft delete

    # Payment fields
    payment_status       = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    payment_method       = models.CharField(max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.PENDING)
    esewa_transaction_id = models.CharField(max_length=255, blank=True)
    esewa_ref_id         = models.CharField(max_length=255, blank=True)
    amount_paid          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} by {self.buyer.username} — {self.status}"
