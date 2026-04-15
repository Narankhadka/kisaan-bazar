from django.db import models
from django.conf import settings
from apps.crops.models import Crop


class Listing(models.Model):
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="listings", limit_choices_to={"role": "FARMER"}
    )
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name="listings")
    quantity_kg = models.DecimalField(max_digits=8, decimal_places=2)
    asking_price = models.DecimalField(max_digits=8, decimal_places=2)  # रु. per kg
    description = models.TextField(blank=True)
    district = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)   # soft delete
    photo = models.ImageField(upload_to="listings/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.farmer.username} — {self.crop.name_nepali} ({self.quantity_kg} kg)"


class SavedListing(models.Model):
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="saved_listings", limit_choices_to={"role": "BUYER"}
    )
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("buyer", "listing")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.buyer.username} saved {self.listing}"
