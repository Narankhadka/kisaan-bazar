from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        FARMER = "FARMER", "किसान"
        BUYER = "BUYER", "खरिदकर्ता"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    full_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    district = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    # Step 2 — location & profile
    municipality = models.CharField(max_length=100, blank=True)
    ward_number = models.IntegerField(null=True, blank=True)
    farm_size_ropani = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    business_type = models.CharField(max_length=50, blank=True)
    main_crops = models.ManyToManyField("crops.Crop", blank=True, related_name="farmers")

    # Step 3 — photo & ID verification
    profile_photo = models.ImageField(upload_to="profile_photos/", null=True, blank=True)
    id_type = models.CharField(max_length=20, blank=True)
    id_number = models.CharField(max_length=50, blank=True)
    id_front_photo = models.ImageField(upload_to="id_photos/", null=True, blank=True)
    id_back_photo = models.ImageField(upload_to="id_photos/", null=True, blank=True)
    is_id_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
