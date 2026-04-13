from django.db import models
from django.conf import settings
from apps.crops.models import Crop


class PriceAlert(models.Model):
    class Condition(models.TextChoices):
        ABOVE = "ABOVE", "माथि (Above)"
        BELOW = "BELOW", "तल (Below)"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alerts")
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name="alerts")
    threshold_price = models.DecimalField(max_digits=8, decimal_places=2)
    condition = models.CharField(max_length=5, choices=Condition.choices)
    via_sms = models.BooleanField(default=True)
    via_email = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.user.username} — {self.crop.name_nepali} "
            f"{self.get_condition_display()} रु.{self.threshold_price}"
        )
