from django.urls import path
from .views import AlertListCreateView, AlertDeleteView, TestSMSView

urlpatterns = [
    path("",           AlertListCreateView.as_view(), name="alert-list"),
    path("my/",        AlertListCreateView.as_view(), name="alert-my"),
    path("test-sms/",  TestSMSView.as_view(),         name="alert-test-sms"),
    path("<int:pk>/",  AlertDeleteView.as_view(),      name="alert-delete"),
]
