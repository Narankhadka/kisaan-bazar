from django.urls import path
from .views import RegisterView, MeView, RateLimitedLoginView, ChangePasswordView, SendOTPView, VerifyOTPView
from .token_views import CookieTokenRefreshView, LogoutView

urlpatterns = [
    path("register/",        RegisterView.as_view(),          name="auth-register"),
    path("login/",           RateLimitedLoginView.as_view(),  name="auth-login"),
    path("refresh/",         CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/",          LogoutView.as_view(),             name="auth-logout"),
    path("me/",              MeView.as_view(),                 name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(),     name="auth-change-password"),
    path("send-otp/",        SendOTPView.as_view(),            name="auth-send-otp"),
    path("verify-otp/",      VerifyOTPView.as_view(),          name="auth-verify-otp"),
]
