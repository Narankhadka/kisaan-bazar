import os
from decimal import Decimal

from rest_framework import serializers

from apps.crops.models import Crop
from apps.crops.serializers import CropSerializer
from apps.users.serializers import VALID_DISTRICTS
from .models import Listing, SavedListing

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def validate_positive(value, field_name):
    if value is not None and value <= Decimal("0"):
        raise serializers.ValidationError(f"{field_name} शून्यभन्दा बढी हुनुपर्छ।")
    return value


class ListingSerializer(serializers.ModelSerializer):
    crop = CropSerializer(read_only=True)
    crop_id = serializers.PrimaryKeyRelatedField(
        source="crop",
        queryset=Crop.objects.all(),
        write_only=True,
    )
    farmer_name = serializers.CharField(source="farmer.username", read_only=True)
    farmer_phone = serializers.CharField(source="farmer.phone", read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id", "farmer_name", "farmer_phone", "crop", "crop_id",
            "quantity_kg", "asking_price", "description",
            "district", "is_available", "photo", "created_at", "is_saved"
        )
        read_only_fields = ("id", "farmer_name", "farmer_phone", "created_at", "is_saved")

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if request.user.role != "BUYER":
            return False
        return SavedListing.objects.filter(buyer=request.user, listing=obj).exists()

    def validate_quantity_kg(self, value):
        return validate_positive(value, "परिमाण")

    def validate_asking_price(self, value):
        return validate_positive(value, "मूल्य")

    def validate_district(self, value):
        if value and value not in VALID_DISTRICTS:
            raise serializers.ValidationError("नेपालको ७७ जिल्लामध्ये एक छान्नुस्।")
        return value

    def validate_photo(self, value):
        if not value:
            return value
        # Check file extension
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise serializers.ValidationError(
                f"फोटो फाइल प्रकार मान्य छैन। मान्य प्रकार: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
        # Check file size
        if value.size > MAX_PHOTO_SIZE_BYTES:
            raise serializers.ValidationError(
                f"फोटो फाइल साइज ५ MB भन्दा कम हुनुपर्छ।"
            )
        return value


class SavedListingSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = SavedListing
        fields = ("id", "listing", "created_at")
