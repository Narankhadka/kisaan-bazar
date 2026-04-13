from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)

    class Meta:
        model = Order
        fields = ("id", "buyer_name", "listing", "quantity_kg", "status", "message", "created_at")
        read_only_fields = ("id", "buyer_name", "status", "created_at")


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)
