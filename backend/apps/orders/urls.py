from django.urls import path
from .views import (
    OrderCreateView,
    MyOrderListView,
    OrderStatusUpdateView,
    BuyerCancelOrderView,
    InitiatePaymentView,
    VerifyPaymentView,
)

urlpatterns = [
    path("", OrderCreateView.as_view(), name="order-create"),
    path("my/", MyOrderListView.as_view(), name="order-my"),
    # verify-payment MUST come before <int:pk>/ patterns
    path("verify-payment/", VerifyPaymentView.as_view(), name="order-verify-payment"),
    path("<int:pk>/status/", OrderStatusUpdateView.as_view(), name="order-status"),
    path("<int:pk>/initiate-payment/", InitiatePaymentView.as_view(), name="order-initiate-payment"),
    path("<int:pk>/", BuyerCancelOrderView.as_view(), name="order-cancel"),
]
