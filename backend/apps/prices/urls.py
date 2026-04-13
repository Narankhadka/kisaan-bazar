from django.urls import path
from .views import TodayPriceListView, PriceHistoryView, TrendingPriceView

urlpatterns = [
    path("today/", TodayPriceListView.as_view(), name="price-today"),
    path("history/<int:crop_id>/", PriceHistoryView.as_view(), name="price-history"),
    path("trending/", TrendingPriceView.as_view(), name="price-trending"),
]
