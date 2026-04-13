from rest_framework import serializers
from .models import DailyPrice
from apps.crops.models import Crop
from apps.crops.serializers import CropSerializer


class DailyPriceSerializer(serializers.ModelSerializer):
    crop = CropSerializer(read_only=True)
    crop_id = serializers.PrimaryKeyRelatedField(
        source="crop",
        queryset=Crop.objects.all(),
        write_only=True,
    )

    class Meta:
        model = DailyPrice
        fields = ("id", "crop", "crop_id", "date", "min_price", "max_price", "avg_price", "source")
        read_only_fields = ("avg_price",)
