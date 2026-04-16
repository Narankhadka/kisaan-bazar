import random

from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.alerts.sms import send_otp_sms

from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .token_views import CookieTokenObtainPairView, _set_refresh_cookie


@method_decorator(
    ratelimit(key="ip", rate="5/15m", method="POST", block=True),
    name="dispatch",
)
class RateLimitedLoginView(CookieTokenObtainPairView):
    """
    POST /api/auth/login/
    Rate-limited: max 5 attempts per IP per 15 minutes.
    Returns access token in body; refresh token in httpOnly cookie.
    Farmers with is_id_verified=False are blocked with 403.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        user = serializer.user

        # FARMER must have admin-verified ID before logging in
        if user.role == User.Role.FARMER and not user.is_id_verified:
            return Response(
                {
                    'error': 'pending_verification',
                    'message': (
                        'तपाईंको परिचयपत्र प्रमाणीकरण हुन बाँकी छ। '
                        'Admin ले verify गरेपछि login गर्न सक्नुहुनेछ।'
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # FARMER/BUYER must verify phone; enforce after 24-hour grace period
        phone_warning = None
        if user.role in (User.Role.FARMER, User.Role.BUYER) and not user.is_phone_verified:
            account_age = timezone.now() - user.date_joined
            age_seconds = account_age.total_seconds()
            if age_seconds > 86400:
                return Response(
                    {
                        'error': 'phone_not_verified',
                        'message': 'फोन verify गर्नुस्',
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            hours_left = (86400 - age_seconds) / 3600
            phone_warning = round(hours_left, 1)

        refresh = serializer.validated_data["refresh"]
        access  = serializer.validated_data["access"]
        response_data = {"access": access}
        if phone_warning is not None:
            response_data["warning"] = "phone_pending"
            response_data["hours_remaining"] = phone_warning

        response = Response(response_data, status=status.HTTP_200_OK)
        _set_refresh_cookie(response, refresh)
        return response


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


def _check_otp_rate(user_id: int) -> bool:
    """
    Returns True if the user has hit the rate limit (3 OTP sends per hour).
    Uses Django cache with a 1-hour sliding window starting from first send.
    """
    key = f"otp_rate_{user_id}"
    count = cache.get(key, 0)
    if count >= 3:
        return True
    cache.set(key, count + 1, timeout=3600)
    return False


class SendOTPView(APIView):
    """POST /api/auth/send-otp/ — generate and send (or print) a 6-digit OTP."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user

        if user.is_phone_verified:
            return Response({"message": "फोन पहिलेनै verify भइसकेको छ।"})

        if _check_otp_rate(user.id):
            return Response(
                {"error": "धेरै पटक कोशिस भयो। १ घण्टा पछि पुनः प्रयास गर्नुस्।"},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        otp = str(random.randint(100000, 999999))
        user.phone_otp = otp
        user.phone_otp_created_at = timezone.now()
        user.save(update_fields=["phone_otp", "phone_otp_created_at"])

        from apps.alerts.sms import SparrowSMS
        dev_mode = not SparrowSMS().is_configured()
        send_otp_sms(user.phone, otp)

        return Response({"message": "OTP पठाइयो", "dev_mode": dev_mode})


class VerifyOTPView(APIView):
    """POST /api/auth/verify-otp/ — check the submitted OTP and mark phone verified."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        submitted = request.data.get("otp", "").strip()

        if not user.phone_otp:
            return Response(
                {"error": "पहिले OTP पठाउनुस्।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Expiry check — 10 minutes
        if user.phone_otp_created_at:
            elapsed = timezone.now() - user.phone_otp_created_at
            if elapsed.total_seconds() > 600:
                return Response(
                    {"error": "OTP म्याद सकियो"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if submitted != user.phone_otp:
            return Response(
                {"error": "OTP गलत छ"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_phone_verified = True
        user.phone_otp = ""
        user.save(update_fields=["is_phone_verified", "phone_otp"])

        return Response({"verified": True})
