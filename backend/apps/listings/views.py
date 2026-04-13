from rest_framework import generics, permissions
from .models import Listing
from .serializers import ListingSerializer


class IsFarmer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "FARMER"


class ListingListCreateView(generics.ListCreateAPIView):
    """GET /api/listings/ (public) | POST (farmer only)"""
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsFarmer()]

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True, is_available=True).select_related("crop", "farmer")
        district = self.request.query_params.get("district")
        if district:
            qs = qs.filter(district__icontains=district)
        crop = self.request.query_params.get("crop")
        if crop:
            qs = qs.filter(crop__name_nepali__icontains=crop)
        return qs

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PUT /api/listings/<id>/ | DELETE (soft)"""
    serializer_class = ListingSerializer
    permission_classes = (IsFarmer,)

    def get_queryset(self):
        return Listing.objects.filter(farmer=self.request.user, is_active=True)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class MyListingView(generics.ListAPIView):
    """GET /api/listings/my/"""
    serializer_class = ListingSerializer
    permission_classes = (IsFarmer,)

    def get_queryset(self):
        return Listing.objects.filter(farmer=self.request.user, is_active=True)
