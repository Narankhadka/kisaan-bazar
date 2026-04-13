from rest_framework import serializers
from .models import PriceAlert
from apps.crops.serializers import CropSerializer


class PriceAlertSerializer(serializers.ModelSerializer):
    crop_detail = CropSerializer(source="crop", read_only=True)

    class Meta:
        model = PriceAlert
        fields = (
            "id", "crop", "crop_detail",
            "threshold_price", "condition",
            "via_sms", "via_email", "is_active", "created_at",
        )
        read_only_fields = ("id", "crop_detail", "created_at")
