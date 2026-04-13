from rest_framework import generics, permissions
from .models import Crop
from .serializers import CropSerializer


class CropListView(generics.ListAPIView):
    queryset = Crop.objects.filter(is_active=True)
    serializer_class = CropSerializer
    permission_classes = (permissions.AllowAny,)
    search_fields = ("name_nepali", "name_english")


class CropDetailView(generics.RetrieveAPIView):
    queryset = Crop.objects.filter(is_active=True)
    serializer_class = CropSerializer
    permission_classes = (permissions.AllowAny,)
