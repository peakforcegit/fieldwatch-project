from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import LocationLog
from .serializers import LocationLogSerializer, LocationLogCreateSerializer
from apps.guards.models import Guard

# Helper to get the guard object for the logged-in user
def get_guard_for_user(user):
    try:
        return Guard.objects.get(user=user)
    except Guard.DoesNotExist:
        return None

class LocationLogListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'guard':
            guard = get_guard_for_user(user)
            return LocationLog.objects.filter(guard=guard)
        return LocationLog.objects.filter(guard__organization=user.organization)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LocationLogCreateSerializer
        return LocationLogSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def live_locations(request):
    """Get latest location for each guard (within last 30 minutes)"""
    thirty_minutes_ago = timezone.now() - timedelta(minutes=30)
    user = request.user
    if user.role == 'guard':
        guard = get_guard_for_user(user)
        latest_log = guard.location_logs.filter(timestamp__gte=thirty_minutes_ago).first()
        if latest_log:
            return Response([LocationLogSerializer(latest_log).data])
        return Response([])
    # For admin/manager, show all guards
    latest_locations = []
    guards = user.organization.guards.filter(is_active=True)
    for guard in guards:
        latest_log = guard.location_logs.filter(timestamp__gte=thirty_minutes_ago).first()
        if latest_log:
            latest_locations.append(LocationLogSerializer(latest_log).data)
    return Response(latest_locations)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def guard_track(request, guard_id):
    """Get location history for a specific guard"""
    from apps.guards.models import Guard
    user = request.user
    if user.role == 'guard':
        guard = get_guard_for_user(user)
        if guard.id != guard_id:
            return Response({'error': 'You can only view your own location history.'}, status=403)
    try:
        guard = Guard.objects.get(id=guard_id, organization=user.organization)
    except Guard.DoesNotExist:
        return Response({'error': 'Guard not found'}, status=404)
    # Get locations from last 24 hours by default
    hours = int(request.GET.get('hours', 24))
    since = timezone.now() - timedelta(hours=hours)
    locations = guard.location_logs.filter(timestamp__gte=since)
    serializer = LocationLogSerializer(locations, many=True)
    return Response({
        'guard': guard.name,
        'locations': serializer.data
    })

