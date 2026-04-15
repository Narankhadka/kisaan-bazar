from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer, OrderStatusSerializer


class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "BUYER"


class OrderCreateView(generics.CreateAPIView):
    """POST /api/orders/"""
    serializer_class = OrderSerializer
    permission_classes = (IsBuyer,)

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)


class MyOrderListView(generics.ListAPIView):
    """GET /api/orders/my/"""
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == "BUYER":
            return Order.objects.filter(buyer=user, is_active=True)
        # Farmer sees orders on their listings
        return Order.objects.filter(listing__farmer=user, is_active=True)


class IsFarmer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "FARMER"


class OrderStatusUpdateView(generics.UpdateAPIView):
    """PATCH /api/orders/<id>/status/ — farmer accepts/rejects"""
    serializer_class = OrderStatusSerializer
    permission_classes = (IsFarmer,)
    http_method_names = ["patch"]

    def get_queryset(self):
        return Order.objects.filter(listing__farmer=self.request.user, is_active=True)


class BuyerCancelOrderView(APIView):
    """DELETE /api/orders/<id>/ — buyer cancels a PENDING order (soft delete)"""
    permission_classes = (IsBuyer,)

    def delete(self, request, pk):
        order = generics.get_object_or_404(
            Order, pk=pk, buyer=request.user, status=Order.Status.PENDING, is_active=True
        )
        order.is_active = False
        order.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
