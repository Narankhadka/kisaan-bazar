from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .token_views import CookieTokenObtainPairView


@method_decorator(
    ratelimit(key="ip", rate="5/15m", method="POST", block=True),
    name="dispatch",
)
class RateLimitedLoginView(CookieTokenObtainPairView):
    """
    POST /api/auth/login/
    Rate-limited: max 5 attempts per IP per 15 minutes.
    Returns access token in body; refresh token in httpOnly cookie.
    """


@method_decorator(
    ratelimit(key="ip", rate="3/h", method="POST", block=True),
    name="dispatch",
)
class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Rate-limited: max 3 registrations per IP per hour.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        current  = request.data.get("current_password", "")
        new      = request.data.get("new_password", "")
        confirm  = request.data.get("confirm_password", "")

        if not user.check_password(current):
            return Response(
                {"current_password": "पुरानो पासवर्ड गलत छ।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new != confirm:
            return Response(
                {"confirm_password": "नयाँ पासवर्ड र पुष्टि पासवर्ड मेल खाएन।"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(new, user)
        except DjangoValidationError as e:
            return Response(
                {"new_password": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new)
        user.save()
        return Response({"message": "पासवर्ड सफलतापूर्वक परिवर्तन भयो।"})
