from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User

REGISTER = "auth-register"
LOGIN    = "auth-login"
REFRESH  = "auth-refresh"
ME       = "auth-me"


STRONG_PASSWORD = "SecurePass1"   # meets: ≥8 chars, uppercase, digit, not common

def _reg(client, **overrides):
    """POST a valid registration; override any field via kwargs."""
    data = {
        "username": "ram",
        "email":    "ram@example.com",
        "password": STRONG_PASSWORD,
        "role":     "FARMER",
        "phone":    "9800000000",
        "district": "काठमाडौं",
    }
    data.update(overrides)
    return client.post(reverse(REGISTER), data)


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    # happy paths
    def test_farmer_registration(self):
        resp = _reg(self.client, username="ram_farmer", role="FARMER")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().role, "FARMER")

    def test_buyer_registration(self):
        resp = _reg(self.client, username="sita_buyer",
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

    def test_duplicate_username_rejected(self):
        _reg(self.client)                                           # first user
        resp = _reg(self.client, email="other@example.com",        # same username
                    phone="9800000099")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_required_fields_rejected(self):
        resp = self.client.post(reverse(REGISTER), {"username": "x"})
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
            username="ram", password="SecurePass1", role="FARMER"
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
