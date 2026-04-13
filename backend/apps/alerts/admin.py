from django.contrib import admin
from .models import PriceAlert


@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = ("user", "crop", "condition", "threshold_price", "via_sms", "via_email", "is_active")
    list_filter = ("condition", "via_sms", "via_email", "is_active")
