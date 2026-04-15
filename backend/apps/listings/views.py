from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Listing, SavedListing
from .serializers import ListingSerializer, SavedListingSerializer


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


class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "BUYER"


class SaveListingView(APIView):
    """POST /api/listings/<id>/save/ — buyer saves a listing"""
    permission_classes = (IsBuyer,)

    def post(self, request, pk):
        listing = generics.get_object_or_404(Listing, pk=pk, is_active=True)
        SavedListing.objects.get_or_create(buyer=request.user, listing=listing)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)


class UnsaveListingView(APIView):
    """DELETE /api/listings/<id>/unsave/ — buyer removes saved listing"""
    permission_classes = (IsBuyer,)

    def delete(self, request, pk):
        SavedListing.objects.filter(buyer=request.user, listing_id=pk).delete()
        return Response({"saved": False}, status=status.HTTP_200_OK)


class SavedListingsView(generics.ListAPIView):
    """GET /api/listings/saved/ — buyer's saved listings"""
    serializer_class = SavedListingSerializer
    permission_classes = (IsBuyer,)

    def get_queryset(self):
        return SavedListing.objects.filter(
            buyer=self.request.user,
            listing__is_active=True,
        ).select_related("listing__crop", "listing__farmer")
