import datetime
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from PIL import Image
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User

REGISTER   = "auth-register"
LOGIN      = "auth-login"
REFRESH    = "auth-refresh"
ME         = "auth-me"
SEND_OTP   = "auth-send-otp"
VERIFY_OTP = "auth-verify-otp"


STRONG_PASSWORD = "SecurePass1"   # meets: ≥8 chars, uppercase, digit, not common

def _fake_photo(name="id.jpg"):
    """Return a valid 1x1 JPEG SimpleUploadedFile for id photo fields."""
    buf = BytesIO()
    Image.new("RGB", (1, 1), color=(100, 100, 100)).save(buf, format="JPEG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/jpeg")


def _reg(client, **overrides):
    """POST a valid registration; override any field via kwargs.
    Note: username is no longer a registration field — it is auto-set from phone.
    """
    data = {
        "email":         "ram@example.com",
        "password":      STRONG_PASSWORD,
        "role":          "FARMER",
        "phone":         "9800000000",
        "district":      "काठमाडौं",
        "id_front_photo": _fake_photo(),
    }
    data.update(overrides)
    # Remove stale username overrides — not accepted by API anymore
    data.pop("username", None)
    # If role is BUYER, remove farmer-only id photo unless explicitly overridden
    if data.get("role") == "BUYER" and "id_front_photo" not in overrides:
        data.pop("id_front_photo", None)
    return client.post(reverse(REGISTER), data, format="multipart")


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    # happy paths
    def test_farmer_registration(self):
        resp = _reg(self.client, role="FARMER")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        u = User.objects.first()
        self.assertEqual(u.role, "FARMER")
        # username is auto-set to phone number
        self.assertEqual(u.username, "9800000000")

    def test_buyer_registration(self):
        resp = _reg(self.client,
                    email="sita@example.com", role="BUYER", phone="9811111111")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_password_is_hashed_not_stored_plain(self):
        _reg(self.client)
        user = User.objects.first()
        self.assertNotEqual(user.password, STRONG_PASSWORD)
        self.assertTrue(user.check_password(STRONG_PASSWORD))

    # validation failures
    def test_short_password_rejected(self):
        resp = _reg(self.client, password="abc")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_duplicate_phone_rejected(self):
        _reg(self.client)                                    # first: phone=9800000000
        resp = _reg(self.client, email="other@example.com") # same phone → duplicate
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", resp.data)

    def test_missing_required_fields_rejected(self):
        resp = self.client.post(reverse(REGISTER), {"phone": "9800000000"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_role_value_rejected(self):
        """Role must be FARMER, BUYER, or ADMIN — anything else is invalid."""
        resp = _reg(self.client, role="WHOLESALER")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", resp.data)


# ---------------------------------------------------------------------------
# JWT login / refresh
# ---------------------------------------------------------------------------

class JWTLoginTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="ram", password="SecurePass1", role="FARMER",
            is_id_verified=True,   # verified so login is not blocked
        )

    def test_login_returns_access_token_in_body(self):
        """Login now returns access token in body; refresh is in httpOnly cookie."""
        resp = self.client.post(reverse(LOGIN), {
            "username": "ram",
            "password": "SecurePass1",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        # Refresh token must NOT be in the response body (it's in the cookie)
        self.assertNotIn("refresh", resp.data)
        self.assertIn("kisanbazar_refresh", resp.cookies)

    def test_refresh_token_via_cookie(self):
        """Refresh endpoint reads the httpOnly cookie, not request body."""
        login = self.client.post(reverse(LOGIN), {
            "username": "ram", "password": "SecurePass1"
        })
        # Cookie is set automatically on the test client after login
        resp = self.client.post(reverse(REFRESH))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_refresh_without_cookie_returns_401(self):
        resp = self.client.post(reverse(REFRESH))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_password_rejected(self):
        resp = self.client.post(reverse(LOGIN), {
            "username": "ram", "password": "wrongpass"
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user_rejected(self):
        resp = self.client.post(reverse(LOGIN), {
            "username": "nobody", "password": "somepass"
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_token_grants_access_to_protected_endpoint(self):
        login = self.client.post(reverse(LOGIN), {
            "username": "ram", "password": "SecurePass1"
        })
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['access']}"
        )
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_logout_blacklists_refresh_token(self):
        """After logout, the refresh cookie should be cleared and token blacklisted."""
        login = self.client.post(reverse(LOGIN), {
            "username": "ram", "password": "SecurePass1"
        })
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        # Log out (cookie is automatically sent by test client)
        resp = self.client.post(reverse("auth-logout"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # After logout, refresh should fail
        resp2 = self.client.post(reverse(REFRESH))
        self.assertEqual(resp2.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# /api/auth/me/
# ---------------------------------------------------------------------------

class MeEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="ram", password="pass1234",
            role="FARMER", phone="9800000001",
            email="ram@example.com", district="काठमाडौं",
        )

    def test_me_returns_current_user_fields(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "ram")
        self.assertEqual(resp.data["role"],     "FARMER")
        self.assertEqual(resp.data["phone"],    "9800000001")
        self.assertEqual(resp.data["district"], "काठमाडौं")

    def test_me_does_not_leak_password(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertNotIn("password", resp.data)

    def test_me_requires_authentication(self):
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_patch_updates_district(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(reverse(ME), {"district": "ललितपुर"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.district, "ललितपुर")

    def test_me_only_shows_own_data_not_others(self):
        other = User.objects.create_user(
            username="other_user", password="pass1234", role="BUYER"
        )
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.data["username"], "ram")   # not other_user
        self.assertNotEqual(resp.data["id"], other.id)


# ---------------------------------------------------------------------------
# Password validation (strong password policy)
# ---------------------------------------------------------------------------

class PasswordValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_password_without_uppercase_rejected(self):
        resp = _reg(self.client, username="u1", email="u1@test.com", password="lowercase1")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_password_without_number_rejected(self):
        resp = _reg(self.client, username="u2", email="u2@test.com", password="NoNumbers!")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_common_password_rejected(self):
        resp = _reg(self.client, username="u3", email="u3@test.com", password="Password1")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_strong_password_accepted(self):
        resp = _reg(self.client, username="u4", email="u4@test.com", password="KisanBazar9")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Phone & District validation
# ---------------------------------------------------------------------------

class PhoneDistrictValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_invalid_phone_rejected(self):
        resp = _reg(self.client, username="v1", email="v1@test.com", phone="1234567890")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", resp.data)

    def test_phone_wrong_prefix_rejected(self):
        resp = _reg(self.client, username="v2", email="v2@test.com", phone="9600000000")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", resp.data)

    def test_phone_too_short_rejected(self):
        resp = _reg(self.client, username="v3", email="v3@test.com", phone="98000")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", resp.data)

    def test_valid_98_phone_accepted(self):
        resp = _reg(self.client, username="v4", email="v4@test.com", phone="9812345678")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_valid_97_phone_accepted(self):
        resp = _reg(self.client, username="v5", email="v5@test.com", phone="9712345678")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_invalid_district_rejected(self):
        resp = _reg(self.client, username="v6", email="v6@test.com", district="Mumbai")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("district", resp.data)

    def test_valid_district_accepted(self):
        resp = _reg(self.client, username="v7", email="v7@test.com", district="काठमाडौं")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# ID Verification — login gate for farmers
# ---------------------------------------------------------------------------

class IDVerificationLoginTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.unverified_farmer = User.objects.create_user(
            username="unverified_farmer", password="SecurePass1",
            role="FARMER", is_id_verified=False,
        )
        self.verified_farmer = User.objects.create_user(
            username="verified_farmer", password="SecurePass1",
            role="FARMER", is_id_verified=True,
        )
        self.buyer = User.objects.create_user(
            username="buyer_user", password="SecurePass1",
            role="BUYER",
        )

    def _login(self, username):
        return self.client.post(reverse(LOGIN), {
            "username": username, "password": "SecurePass1",
        })

    def test_unverified_farmer_cannot_login(self):
        resp = self._login("unverified_farmer")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("error"), "pending_verification")

    def test_unverified_farmer_gets_nepali_message(self):
        resp = self._login("unverified_farmer")
        self.assertIn("message", resp.data)
        self.assertIn("परिचयपत्र", resp.data["message"])

    def test_verified_farmer_can_login(self):
        resp = self._login("verified_farmer")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_buyer_can_login_without_id_verification(self):
        resp = self._login("buyer_user")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_verifying_farmer_allows_login(self):
        """After admin verifies a farmer, they can login."""
        self.unverified_farmer.is_id_verified = True
        self.unverified_farmer.save()
        resp = self._login("unverified_farmer")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Phone OTP verification
# ---------------------------------------------------------------------------

from django.test.utils import override_settings

_DUMMY_CACHE = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}


@override_settings(CACHES=_DUMMY_CACHE)
class OTPVerificationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="otp_buyer", password="SecurePass1",
            role="BUYER", phone="9800000001",
            is_phone_verified=False,
        )
        self.client.force_authenticate(user=self.user)

    def test_send_otp_returns_200(self):
        resp = self.client.post(reverse(SEND_OTP))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("message", resp.data)

    def test_send_otp_saves_otp_on_user(self):
        self.client.post(reverse(SEND_OTP))
        self.user.refresh_from_db()
        self.assertEqual(len(self.user.phone_otp), 6)
        self.assertTrue(self.user.phone_otp.isdigit())

    def test_send_otp_dev_mode_true_when_sparrow_not_configured(self):
        resp = self.client.post(reverse(SEND_OTP))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("dev_mode"))

    def test_verify_otp_correct(self):
        self.client.post(reverse(SEND_OTP))
        self.user.refresh_from_db()
        otp = self.user.phone_otp

        resp = self.client.post(reverse(VERIFY_OTP), {"otp": otp})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data.get("verified"))

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_phone_verified)
        self.assertEqual(self.user.phone_otp, "")

    def test_verify_otp_wrong_returns_400(self):
        self.client.post(reverse(SEND_OTP))
        resp = self.client.post(reverse(VERIFY_OTP), {"otp": "000000"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("OTP गलत छ", resp.data.get("error", ""))

    def test_verify_otp_expired_returns_400(self):
        self.client.post(reverse(SEND_OTP))
        self.user.refresh_from_db()
        # Backdate OTP creation time beyond 10 minutes
        self.user.phone_otp_created_at = timezone.now() - datetime.timedelta(minutes=11)
        self.user.save(update_fields=["phone_otp_created_at"])

        resp = self.client.post(reverse(VERIFY_OTP), {"otp": self.user.phone_otp})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("म्याद", resp.data.get("error", ""))

    def test_unverified_user_after_24hrs_gets_403_on_login(self):
        # Backdate date_joined beyond 24 hours
        User.objects.filter(pk=self.user.pk).update(
            date_joined=timezone.now() - datetime.timedelta(hours=25)
        )
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse(LOGIN), {
            "username": "otp_buyer",
            "password": "SecurePass1",
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("error"), "phone_not_verified")

    def test_phone_verified_user_login_returns_200(self):
        self.user.is_phone_verified = True
        self.user.save()
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse(LOGIN), {
            "username": "otp_buyer",
            "password": "SecurePass1",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertNotIn("warning", resp.data)

    def test_new_unverified_user_login_includes_warning(self):
        """Newly registered user (< 24h) gets access token + phone_pending warning."""
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse(LOGIN), {
            "username": "otp_buyer",
            "password": "SecurePass1",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertEqual(resp.data.get("warning"), "phone_pending")
        self.assertIn("hours_remaining", resp.data)
