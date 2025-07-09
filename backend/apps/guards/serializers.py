from rest_framework import serializers
from .models import Guard


class GuardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Guard
        fields = [
            "id",
            "name",
            "phone",
            "assigned_route",
            "is_active",
            "username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["organization"] = self.context["request"].user.organization
        return super().create(validated_data)


class GuardCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guard
        fields = ["name", "phone", "assigned_route"]

    def create(self, validated_data):
        validated_data["organization"] = self.context["request"].user.organization
        return super().create(validated_data)
