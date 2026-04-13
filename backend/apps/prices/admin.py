from django.contrib import admin
from .models import DailyPrice


@admin.register(DailyPrice)
class DailyPriceAdmin(admin.ModelAdmin):
    list_display = ("crop", "date", "min_price", "max_price", "avg_price", "source")
    list_filter = ("source", "date", "crop__category")
    search_fields = ("crop__name_nepali", "crop__name_english")
    date_hierarchy = "date"
