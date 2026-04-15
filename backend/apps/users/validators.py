"""
Custom password validators for किसान बजार.
Applied via AUTH_PASSWORD_VALIDATORS in settings/base.py.
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class UppercaseValidator:
    """Password must contain at least one uppercase letter (A–Z)."""

    def validate(self, password, user=None):
        if not any(c.isupper() for c in password):
            raise ValidationError(
                _("पासवर्डमा कम्तिमा एक ठूलो अक्षर (A–Z) हुनुपर्छ।"),
                code="password_no_upper",
            )

    def get_help_text(self):
        return _("पासवर्डमा कम्तिमा एक ठूलो अक्षर (A–Z) हुनुपर्छ।")


class NumberValidator:
    """Password must contain at least one digit (0–9)."""

    def validate(self, password, user=None):
        if not any(c.isdigit() for c in password):
            raise ValidationError(
                _("पासवर्डमा कम्तिमा एक अंक (0–9) हुनुपर्छ।"),
                code="password_no_number",
            )

    def get_help_text(self):
        return _("पासवर्डमा कम्तिमा एक अंक (0–9) हुनुपर्छ।")
