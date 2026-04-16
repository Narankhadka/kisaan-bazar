from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    buyer_name    = serializers.CharField(source="buyer.username",          read_only=True)
    buyer_phone   = serializers.CharField(source="buyer.phone",             read_only=True)
    crop_name     = serializers.CharField(source="listing.crop.name_nepali", read_only=True)
    crop_emoji    = serializers.CharField(source="listing.crop.emoji",       read_only=True)
    farmer_name   = serializers.CharField(source="listing.farmer.username",  read_only=True)
    farmer_phone  = serializers.CharField(source="listing.farmer.phone",     read_only=True)
    farmer_district = serializers.CharField(source="listing.district",       read_only=True)
    asking_price  = serializers.DecimalField(
        source="listing.asking_price", max_digits=8, decimal_places=2, read_only=True
    )

    class Meta:
        model = Order
        fields = (
            "id", "buyer_name", "buyer_phone", "listing",
            "crop_name", "crop_emoji",
            "farmer_name", "farmer_phone", "farmer_district",
            "asking_price",
            "quantity_kg", "status", "message",
            "payment_status", "payment_method", "amount_paid",
            "created_at",
        )
        read_only_fields = (
            "id", "buyer_name", "buyer_phone",
            "crop_name", "crop_emoji",
            "farmer_name", "farmer_phone", "farmer_district",
            "asking_price", "status",
            "payment_status", "payment_method", "amount_paid",
            "created_at",
        )


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)
