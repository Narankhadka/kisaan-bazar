"""
JWT views that store the refresh token in an httpOnly cookie
instead of the response body, reducing XSS exposure.

Login  → access token in JSON body + refresh token in httpOnly cookie
Refresh → reads refresh from cookie, returns new access in body
Logout → blacklists the refresh token and clears the cookie
"""
from django.conf import settings
from django.middleware.csrf import get_token as get_csrf_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

COOKIE_NAME = "kisanbazar_refresh"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


def _set_refresh_cookie(response, refresh_token: str) -> None:
    """Attach the refresh token as a Secure httpOnly SameSite=Lax cookie."""
    is_production = not getattr(settings, "DEBUG", True)
    response.set_cookie(
        key=COOKIE_NAME,
        value=refresh_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=is_production,   # Secure flag only in production (HTTPS)
        samesite="Lax",
        path="/api/auth/",      # Restrict cookie to auth endpoints only
    )


def _clear_refresh_cookie(response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/api/auth/")


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Returns {"access": "..."} in body.
    Refresh token is set as httpOnly cookie (not in the body).
    """

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        refresh = serializer.validated_data["refresh"]
        access = serializer.validated_data["access"]

        response = Response({"access": access}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, refresh)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Reads refresh token from the httpOnly cookie (no body required).
    Returns {"access": "..."} in body and rotates the cookie.
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(COOKIE_NAME)
        if not refresh_token:
            return Response(
                {"detail": "Refresh token cookie missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            _clear_refresh_cookie(Response())
            raise InvalidToken(e.args[0])

        new_access = serializer.validated_data["access"]
        new_refresh = serializer.validated_data.get("refresh", refresh_token)

        response = Response({"access": new_access}, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token and clears the cookie.
    Works for both authenticated and unauthenticated requests
    (so the cookie is always cleared).
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(COOKIE_NAME)
        response = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Already blacklisted or invalid — still clear the cookie

        _clear_refresh_cookie(response)
        return response
