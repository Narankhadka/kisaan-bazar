from django.contrib import admin
from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("farmer", "crop", "quantity_kg", "asking_price", "district", "is_available", "is_active")
    list_filter = ("district", "is_available", "is_active", "crop__category")
    search_fields = ("farmer__username", "crop__name_nepali", "district")
