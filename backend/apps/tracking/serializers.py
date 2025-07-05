from rest_framework import serializers
from .models import LocationLog
from apps.guards.serializers import GuardSerializer

class LocationLogSerializer(serializers.ModelSerializer):
    guard = GuardSerializer(read_only=True)
    
    class Meta:
        model = LocationLog
        fields = ['id', 'guard', 'latitude', 'longitude', 'timestamp', 'accuracy', 'battery_level']

class LocationLogCreateSerializer(serializers.ModelSerializer):
    guard_id = serializers.IntegerField()
    
    class Meta:
        model = LocationLog
        fields = ['guard_id', 'latitude', 'longitude', 'accuracy', 'battery_level']

    def validate_guard_id(self, value):
        from apps.guards.models import Guard
        try:
            guard = Guard.objects.get(id=value, organization=self.context['request'].user.organization)
            return value
        except Guard.DoesNotExist:
            raise serializers.ValidationError("Guard not found or not in your organization.")

    def create(self, validated_data):
        from apps.guards.models import Guard
        guard_id = validated_data.pop('guard_id')
        guard = Guard.objects.get(id=guard_id)
        validated_data['guard'] = guard
        return super().create(validated_data)

