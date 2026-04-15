from django.urls import path
from .views import OrderCreateView, MyOrderListView, OrderStatusUpdateView, BuyerCancelOrderView

urlpatterns = [
    path("", OrderCreateView.as_view(), name="order-create"),
    path("my/", MyOrderListView.as_view(), name="order-my"),
    path("<int:pk>/status/", OrderStatusUpdateView.as_view(), name="order-status"),
    path("<int:pk>/", BuyerCancelOrderView.as_view(), name="order-cancel"),
]
