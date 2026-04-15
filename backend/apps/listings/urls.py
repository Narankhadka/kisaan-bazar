from django.urls import path
from .views import (
    ListingListCreateView, ListingDetailView, MyListingView,
    SaveListingView, UnsaveListingView, SavedListingsView,
)

urlpatterns = [
    path("", ListingListCreateView.as_view(), name="listing-list"),
    path("my/", MyListingView.as_view(), name="listing-my"),
    path("saved/", SavedListingsView.as_view(), name="listing-saved"),
    path("<int:pk>/", ListingDetailView.as_view(), name="listing-detail"),
    path("<int:pk>/save/", SaveListingView.as_view(), name="listing-save"),
    path("<int:pk>/unsave/", UnsaveListingView.as_view(), name="listing-unsave"),
]
