from django.urls import path
from . import admin_views

urlpatterns = [
    path('stats/',                   admin_views.AdminStatsView.as_view()),
    path('users/',                   admin_views.AdminUserListView.as_view()),
    path('users/<int:pk>/verify/',   admin_views.AdminUserVerifyView.as_view()),
    path('listings/',                admin_views.AdminListingListView.as_view()),
    path('listings/<int:pk>/',       admin_views.AdminListingDeleteView.as_view()),
    path('orders/',                  admin_views.AdminOrderListView.as_view()),
    path('prices/',                  admin_views.AdminPriceListCreateView.as_view()),
    path('scraper/run/',             admin_views.AdminScraperRunView.as_view()),
    path('scraper/logs/',            admin_views.AdminScraperLogView.as_view()),
]
