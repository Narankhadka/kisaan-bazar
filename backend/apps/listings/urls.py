from django.urls import path
from .views import ListingListCreateView, ListingDetailView, MyListingView

urlpatterns = [
    path("", ListingListCreateView.as_view(), name="listing-list"),
    path("my/", MyListingView.as_view(), name="listing-my"),
    path("<int:pk>/", ListingDetailView.as_view(), name="listing-detail"),
]
