from django.urls import path
from .views import RegisterView, MeView, RateLimitedLoginView, ChangePasswordView
from .token_views import CookieTokenRefreshView, LogoutView

urlpatterns = [
    path("register/",        RegisterView.as_view(),          name="auth-register"),
    path("login/",           RateLimitedLoginView.as_view(),  name="auth-login"),
    path("refresh/",         CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/",          LogoutView.as_view(),             name="auth-logout"),
    path("me/",              MeView.as_view(),                 name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(),     name="auth-change-password"),
]
