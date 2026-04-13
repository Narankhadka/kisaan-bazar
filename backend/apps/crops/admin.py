from django.contrib import admin
from .models import Crop


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ("emoji", "name_nepali", "name_english", "category", "unit", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name_nepali", "name_english")
