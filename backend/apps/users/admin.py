from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "district", "is_verified", "is_active")
    list_filter = ("role", "district", "is_verified")
    fieldsets = UserAdmin.fieldsets + (
        ("KisanBazar", {"fields": ("role", "phone", "district", "address", "is_verified")}),
    )
