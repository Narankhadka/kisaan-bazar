from django.db import models
from apps.crops.models import Crop


class DailyPrice(models.Model):
    class Source(models.TextChoices):
        KALIMATI = "KALIMATI", "Kalimati Market"
        MANUAL = "MANUAL", "Manual Entry"

    crop = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name="prices")
    date = models.DateField()
    min_price = models.DecimalField(max_digits=8, decimal_places=2)
    max_price = models.DecimalField(max_digits=8, decimal_places=2)
    avg_price = models.DecimalField(max_digits=8, decimal_places=2, editable=False)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.KALIMATI)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("crop", "date")
        ordering = ["-date"]

    def save(self, *args, **kwargs):
        # Auto-calculate average price
        self.avg_price = (self.min_price + self.max_price) / 2
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.crop.name_nepali} — {self.date} (avg: रु.{self.avg_price})"
