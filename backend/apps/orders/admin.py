from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "listing", "quantity_kg", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("buyer__username",)
