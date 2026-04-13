from rest_framework import serializers
from .models import Listing
from apps.crops.models import Crop
from apps.crops.serializers import CropSerializer


class ListingSerializer(serializers.ModelSerializer):
    crop = CropSerializer(read_only=True)
    crop_id = serializers.PrimaryKeyRelatedField(
        source="crop",
        queryset=Crop.objects.all(),
        write_only=True,
    )
    farmer_name = serializers.CharField(source="farmer.username", read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id", "farmer_name", "crop", "crop_id",
            "quantity_kg", "asking_price", "description",
            "district", "is_available", "photo", "created_at"
        )
        read_only_fields = ("id", "farmer_name", "created_at")
