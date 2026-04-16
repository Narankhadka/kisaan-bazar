"""
URL configuration for किसान बजार.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth
    path("api/auth/", include("apps.users.urls")),

    # Core resources
    path("api/crops/", include("apps.crops.urls")),
    path("api/prices/", include("apps.prices.urls")),
    path("api/listings/", include("apps.listings.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/alerts/", include("apps.alerts.urls")),

    # Admin panel API (IsAdmin only)
    path("api/admin/", include("apps.scraper.admin_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
