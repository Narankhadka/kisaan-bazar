import os
import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User
from apps.crops.models import Crop

# All 77 Nepal districts (must match the frontend list)
VALID_DISTRICTS = {
    # कोशी प्रदेश
    'ताप्लेजुङ', 'पाँचथर', 'इलाम', 'झापा', 'मोरङ', 'सुनसरी',
    'धनकुटा', 'तेह्रथुम', 'संखुवासभा', 'भोजपुर', 'सोलुखुम्बु',
    'ओखलढुंगा', 'खोटाङ', 'उदयपुर',
    # मधेश प्रदेश
    'सप्तरी', 'सिरहा', 'धनुषा', 'महोत्तरी', 'सर्लाही',
    'रौतहट', 'बारा', 'पर्सा',
    # बागमती प्रदेश
    'सिन्धुली', 'रामेछाप', 'दोलखा', 'सिन्धुपाल्चोक', 'काभ्रेपलाञ्चोक',
    'ललितपुर', 'भक्तपुर', 'काठमाडौं', 'नुवाकोट', 'रसुवा',
    'धादिङ', 'मकवानपुर', 'चितवन',
    # गण्डकी प्रदेश
    'गोरखा', 'लमजुङ', 'तनहुँ', 'कास्की', 'मनाङ', 'मुस्ताङ',
    'म्याग्दी', 'पर्वत', 'बाग्लुङ', 'स्याङजा', 'नवलपुर',
    # लुम्बिनी प्रदेश
    'रुपन्देही', 'कपिलवस्तु', 'नवलपरासी', 'पाल्पा', 'गुल्मी',
    'अर्घाखाँची', 'प्युठान', 'रोल्पा', 'रुकुम पूर्व',
    'दाङ', 'बाँके', 'बर्दिया',
    # कर्णाली प्रदेश
    'डोल्पा', 'मुगु', 'हुम्ला', 'जुम्ला', 'कालिकोट',
    'दैलेख', 'जाजरकोट', 'रुकुम पश्चिम', 'सल्यान', 'सुर्खेत',
    # सुदूरपश्चिम प्रदेश
    'कैलाली', 'कञ्चनपुर', 'डडेल्धुरा', 'बैतडी', 'डोटी',
    'अछाम', 'बाजुरा', 'बझाङ', 'दार्चुला',
}

_NEPAL_PHONE_RE = re.compile(r'^(97|98)\d{8}$')
_ALLOWED_PHOTO_EXT = {'.jpg', '.jpeg', '.png', '.webp'}
_ALLOWED_ID_EXT = {'.jpg', '.jpeg', '.png'}
_MAX_PROFILE_BYTES = 2 * 1024 * 1024   # 2 MB
_MAX_ID_BYTES = 5 * 1024 * 1024         # 5 MB


def validate_nepal_phone(value):
    if value and not _NEPAL_PHONE_RE.match(value):
        raise serializers.ValidationError(
            "नेपाली मोबाइल नम्बर मात्र मान्य छ (98XXXXXXXX वा 97XXXXXXXX)।"
        )


def validate_district(value):
    if value and value not in VALID_DISTRICTS:
        raise serializers.ValidationError(
            "नेपालको ७७ जिल्लामध्ये एक छान्नुस्।"
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    main_crops = serializers.PrimaryKeyRelatedField(
        queryset=Crop.objects.all(), many=True, required=False
    )

    class Meta:
        model = User
        fields = (
            "username", "email", "password", "role",
            "full_name", "phone", "district",
            "municipality", "ward_number", "farm_size_ropani",
            "business_type", "main_crops",
            "profile_photo", "id_type", "id_number",
            "id_front_photo", "id_back_photo",
        )

    def validate_phone(self, value):
        validate_nepal_phone(value)
        return value

    def validate_district(self, value):
        validate_district(value)
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate_profile_photo(self, value):
        if value:
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in _ALLOWED_PHOTO_EXT:
                raise serializers.ValidationError("jpg, jpeg, png, webp मात्र मान्य छ।")
            if value.size > _MAX_PROFILE_BYTES:
                raise serializers.ValidationError("प्रोफाइल फोटो २MB भन्दा बढी हुँदैन।")
        return value

    def _validate_id_photo(self, value):
        if value:
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in _ALLOWED_ID_EXT:
                raise serializers.ValidationError("jpg, jpeg, png मात्र मान्य छ।")
            if value.size > _MAX_ID_BYTES:
                raise serializers.ValidationError("ID फोटो ५MB भन्दा बढी हुँदैन।")
        return value

    def validate_id_front_photo(self, value):
        return self._validate_id_photo(value)

    def validate_id_back_photo(self, value):
        return self._validate_id_photo(value)

    def validate(self, attrs):
        role = attrs.get("role", "BUYER")
        if role == "FARMER":
            if not attrs.get("id_front_photo"):
                raise serializers.ValidationError(
                    {"id_front_photo": "किसानको लागि परिचयपत्रको अगाडिको फोटो अनिवार्य छ।"}
                )
        return attrs

    def create(self, validated_data):
        main_crops = validated_data.pop("main_crops", [])
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        if main_crops:
            user.main_crops.set(main_crops)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "username", "email", "role",
            "full_name", "phone", "district", "address",
            "municipality", "ward_number", "farm_size_ropani", "business_type",
            "profile_photo", "id_type", "is_id_verified", "is_verified",
        )
        read_only_fields = ("id", "is_verified", "is_id_verified")

    def validate_phone(self, value):
        validate_nepal_phone(value)
        return value

    def validate_district(self, value):
        validate_district(value)
        return value
