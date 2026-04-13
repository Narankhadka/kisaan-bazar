from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PriceAlert
from .serializers import PriceAlertSerializer
from .sms import SparrowSMS


class AlertListCreateView(generics.ListCreateAPIView):
    """POST /api/alerts/ | GET /api/alerts/my/"""
    serializer_class = PriceAlertSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlertDeleteView(generics.DestroyAPIView):
    """DELETE /api/alerts/<id>/ — soft delete"""
    serializer_class = PriceAlertSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class TestSMSView(APIView):
    """
    POST /api/alerts/test-sms/
    Admin-only endpoint to verify Sparrow SMS is wired up correctly.

    Request body:
        { "phone": "9800000001", "message": "optional custom text" }

    Returns 200 on success, 400/503 on failure.
    """
    permission_classes = (permissions.IsAdminUser,)

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        if not phone:
            return Response(
                {"error": "phone is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = request.data.get("message") or (
            "किसान बजार: यो एक test SMS हो। Sparrow SMS सेवा सञ्चालनमा छ।"
        )

        sms = SparrowSMS()

        if not sms.is_configured():
            return Response(
                {
                    "error": "SPARROW_SMS_TOKEN is not configured in .env",
                    "hint":  "Add your Sparrow SMS token to the .env file.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        sent = sms.send_sms(phone, message)

        if sent:
            return Response({
                "status":  "sent",
                "phone":   phone,
                "message": message,
            })

        return Response(
            {"error": "SMS delivery failed — check server logs for details"},
            status=status.HTTP_502_BAD_GATEWAY,
        )
