from django.db import models


class Crop(models.Model):
    class Category(models.TextChoices):
        VEGETABLE = "VEGETABLE", "तरकारी"
        FRUIT = "FRUIT", "फलफूल"
        OTHER = "OTHER", "अन्य"

    name_nepali = models.CharField(max_length=100)   # आलु
    name_english = models.CharField(max_length=100)  # Potato
    unit = models.CharField(max_length=20)           # kg / piece / dozen
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.VEGETABLE)
    emoji = models.CharField(max_length=10, blank=True)  # 🥔
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name_nepali"]

    def __str__(self):
        return f"{self.emoji} {self.name_nepali} ({self.name_english})"
