from rest_framework import serializers
from .models import Attendance
from apps.guards.serializers import GuardSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    guard = GuardSerializer(read_only=True)
    duration = serializers.ReadOnlyField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "guard",
            "checkin_time",
            "checkout_time",
            "checkin_method",
            "checkout_method",
            "checkin_latitude",
            "checkin_longitude",
            "checkout_latitude",
            "checkout_longitude",
            "notes",
            "duration",
            "created_at",
            "updated_at",
        ]


class CheckinSerializer(serializers.ModelSerializer):
    guard_id = serializers.IntegerField(required=False)

    class Meta:
        model = Attendance
        fields = [
            "guard_id",
            "checkin_method",
            "checkin_latitude",
            "checkin_longitude",
            "notes",
        ]

    def validate_guard_id(self, value):
        if value is None:
            return value
        from apps.guards.models import Guard

        try:
            guard = Guard.objects.get(
                id=value, organization=self.context["request"].user.organization
            )
            return value
        except Guard.DoesNotExist:
            raise serializers.ValidationError(
                "Guard not found or not in your organization."
            )

    def create(self, validated_data):
        from apps.guards.models import Guard
        from apps.tracking.models import LocationLog
        from django.utils import timezone
        from .models import Shift
        from datetime import datetime, timedelta

        guard_id = validated_data.pop("guard_id", None)
        if guard_id is None:
            # For guard users, get the guard from the request user
            user = self.context["request"].user
            if user.role == "guard":
                try:
                    guard = Guard.objects.get(user=user)
                except Guard.DoesNotExist:
                    raise serializers.ValidationError(
                        "No guard profile found for this user."
                    )
            else:
                raise serializers.ValidationError(
                    "guard_id is required for admin/manager check-ins."
                )
        else:
            guard = Guard.objects.get(id=guard_id)

        # Check if guard already has an active attendance (no checkout)
        active_attendance = Attendance.objects.filter(
            guard=guard, checkout_time__isnull=True
        ).first()
        if active_attendance:
            raise serializers.ValidationError(
                "Guard already has an active attendance session."
            )

        validated_data["guard"] = guard
        validated_data["organization"] = guard.organization
        validated_data["checkin_time"] = timezone.now()

        # Auto-assign shift if not provided
        if not validated_data.get("shift"):
            now = timezone.localtime(validated_data["checkin_time"])
            # Find all shifts for this guard's organization
            shifts = Shift.objects.filter(organization=guard.organization)
            # Find the shift where now is between start_time and end_time
            matched_shift = None
            for shift in shifts:
                shift_start = datetime.combine(now.date(), shift.start_time)
                shift_end = datetime.combine(now.date(), shift.end_time)
                # Handle overnight shifts (end_time < start_time)
                if shift_end <= shift_start:
                    shift_end += timedelta(days=1)
                if shift_start <= now <= shift_end:
                    matched_shift = shift
                    break
            if matched_shift:
                validated_data["shift"] = matched_shift

        # Add default values for required fields if not provided
        if "checkin_method" not in validated_data:
            validated_data["checkin_method"] = "manual"

        # Ensure organization is set
        if not validated_data.get("organization"):
            validated_data["organization"] = self.context["request"].user.organization

        # Save attendance
        attendance = super().create(validated_data)

        # Create LocationLog if lat/lng provided
        latitude = validated_data.get("checkin_latitude")
        longitude = validated_data.get("checkin_longitude")
        if latitude and longitude:
            LocationLog.objects.create(
                guard=guard,
                organization=guard.organization,
                latitude=latitude,
                longitude=longitude,
                timestamp=attendance.checkin_time,
            )

        return attendance


class CheckoutSerializer(serializers.Serializer):
    checkout_method = serializers.CharField(max_length=10, default="manual")
    checkout_latitude = serializers.DecimalField(
        max_digits=10, decimal_places=8, required=False
    )
    checkout_longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True)
