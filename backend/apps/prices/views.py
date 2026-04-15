from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions
from .models import DailyPrice
from .serializers import DailyPriceSerializer


class TodayPriceListView(generics.ListAPIView):
    """GET /api/prices/today/ — supports ?crop=, ?date= filters"""
    serializer_class = DailyPriceSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        # ?date=YYYY-MM-DD falls back to today
        date_param = self.request.query_params.get("date")
        try:
            from datetime import date as date_type
            target_date = date_type.fromisoformat(date_param) if date_param else timezone.localdate()
        except ValueError:
            target_date = timezone.localdate()

        qs = DailyPrice.objects.filter(date=target_date).select_related("crop")

        crop = self.request.query_params.get("crop")
        if crop:
            qs = qs.filter(crop__name_nepali__icontains=crop)

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(crop__category=category.upper())

        return qs


class PriceHistoryView(generics.ListAPIView):
    """GET /api/prices/history/<crop_id>/ — last 30 days"""
    serializer_class = DailyPriceSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        crop_id = self.kwargs["crop_id"]
        since = timezone.localdate() - timedelta(days=30)
        return (
            DailyPrice.objects
            .filter(crop_id=crop_id, date__gte=since)
            .select_related("crop")
            .order_by("-date")
        )


class TrendingPriceView(generics.ListAPIView):
    """GET /api/prices/trending/ — top 10 movers by avg price today"""
    serializer_class = DailyPriceSerializer
    permission_classes = (permissions.AllowAny,)
    # Trending is a fixed top-10 — disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return (
            DailyPrice.objects
            .filter(date=timezone.localdate())
            .select_related("crop")
            .order_by("-avg_price")[:10]
        )
