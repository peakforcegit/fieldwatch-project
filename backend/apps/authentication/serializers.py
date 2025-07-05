from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Organization
from django.db import transaction


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "plan", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "organization",
            "created_at",
        ]
        extra_kwargs = {
            "id": {"read_only": True},
            "username": {"read_only": True},
            "role": {"read_only": True},
            "organization": {"read_only": True},
            "created_at": {"read_only": True},
            "email": {"required": False},
            "first_name": {"required": False},
            "last_name": {"required": False},
            "phone": {"required": False},
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    organization_name = serializers.CharField(
        write_only=True, required=False, default="Default Organization"
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "organization_name",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False},
            "last_name": {"required": False},
            "phone": {"required": False},
        }

    def create(self, validated_data):
        organization_name = validated_data.pop(
            "organization_name", "Default Organization"
        )
        organization, created = Organization.objects.get_or_create(
            name=organization_name
        )
        # Always set role as admin for new registrations
        validated_data["role"] = "admin"
        user = User.objects.create_user(organization=organization, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data["user"] = user
                else:
                    raise serializers.ValidationError("User account is disabled.")
            else:
                raise serializers.ValidationError(
                    "Unable to log in with provided credentials."
                )
        else:
            raise serializers.ValidationError("Must include username and password.")

        return data


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "phone",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False},
            "last_name": {"required": False},
            "role": {"required": True},
            "phone": {"required": False},
        }

    def create(self, validated_data):
        request = self.context.get("request")
        organization = request.user.organization
        with transaction.atomic():
            # Check for duplicate phone+organization in Guard
            if validated_data.get("role") == "guard":
                from apps.guards.models import Guard

                phone = validated_data.get("phone")
                if Guard.objects.filter(
                    phone=phone, organization=organization
                ).exists():
                    raise serializers.ValidationError(
                        "A guard with this phone number already exists in this organization."
                    )
            user = User.objects.create_user(organization=organization, **validated_data)
            # Guard profile create karo agar role guard hai
            if user.role == "guard":
                from apps.guards.models import Guard

                Guard.objects.create(
                    user=user,
                    name=user.get_full_name() or user.username,
                    organization=organization,
                    phone=user.phone,
                )
            return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("New passwords do not match.")
        return data
