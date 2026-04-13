from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User

REGISTER = "auth-register"
LOGIN    = "auth-login"
REFRESH  = "auth-refresh"
ME       = "auth-me"


def _reg(client, **overrides):
    """POST a valid registration; override any field via kwargs."""
    data = {
        "username": "ram",
        "email":    "ram@example.com",
        "password": "securepass123",
        "role":     "FARMER",
        "phone":    "9800000000",
        "district": "Kathmandu",
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
        self.assertNotEqual(user.password, "securepass123")
        self.assertTrue(user.check_password("securepass123"))

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
            username="ram", password="securepass123", role="FARMER"
        )

    def test_login_returns_access_and_refresh_tokens(self):
        resp = self.client.post(reverse(LOGIN), {
            "username": "ram",
            "password": "securepass123",
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access",  resp.data)
        self.assertIn("refresh", resp.data)
        self.assertTrue(resp.data["access"])
        self.assertTrue(resp.data["refresh"])

    def test_refresh_token_returns_new_access_token(self):
        login = self.client.post(reverse(LOGIN), {
            "username": "ram", "password": "securepass123"
        })
        resp = self.client.post(reverse(REFRESH),
                                {"refresh": login.data["refresh"]})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

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
            "username": "ram", "password": "securepass123"
        })
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['access']}"
        )
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# /api/auth/me/
# ---------------------------------------------------------------------------

class MeEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="ram", password="pass1234",
            role="FARMER", phone="9800000001",
            email="ram@example.com", district="Kathmandu",
        )

    def test_me_returns_current_user_fields(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "ram")
        self.assertEqual(resp.data["role"],     "FARMER")
        self.assertEqual(resp.data["phone"],    "9800000001")
        self.assertEqual(resp.data["district"], "Kathmandu")

    def test_me_does_not_leak_password(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertNotIn("password", resp.data)

    def test_me_requires_authentication(self):
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_patch_updates_district(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(reverse(ME), {"district": "Lalitpur"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.district, "Lalitpur")

    def test_me_only_shows_own_data_not_others(self):
        other = User.objects.create_user(
            username="other_user", password="pass1234", role="BUYER"
        )
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse(ME))
        self.assertEqual(resp.data["username"], "ram")   # not other_user
        self.assertNotEqual(resp.data["id"], other.id)
