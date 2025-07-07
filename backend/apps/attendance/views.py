from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
import csv
from .models import Attendance
from .serializers import AttendanceSerializer, CheckinSerializer, CheckoutSerializer
from apps.guards.models import Guard
from calendar import monthrange
from datetime import date

# --- Attendance summary for calendar ---
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def attendance_summary(request):
    """
    Returns a dict: { 'YYYY-MM-DD': 'present'|'absent'|'late'|'half'|'weekend' } for the given guard, year, month
    """
    user = request.user
    guard_id = request.GET.get('guard_id')
    year = int(request.GET.get('year', date.today().year))
    month = int(request.GET.get('month', date.today().month))

    # Get the guard
    # from apps.guards.models import Guard  # already imported at top
    if guard_id:
        try:
            guard = Guard.objects.get(id=guard_id)
        except Guard.DoesNotExist:
            return Response({'error': 'Guard not found'}, status=404)
    else:
        guard = get_guard_for_user(user)
        if not guard:
            return Response({'error': 'Guard not found'}, status=404)

    # Get all attendances for this guard in the month
    # from .models import Attendance  # already imported at top
    start_date = date(year, month, 1)
    end_date = date(year, month, monthrange(year, month)[1])
    attendances = Attendance.objects.filter(guard=guard, checkin_time__date__gte=start_date, checkin_time__date__lte=end_date)

    # Build a map: { 'YYYY-MM-DD': 'present'|'absent'|'late'|'half'|'weekend' }
    days = {}
    weekends = []
    # Get weekend days from guard profile if available, else default to [6, 0] (Sat, Sun)
    weekend_days = [6, 0]
    if hasattr(guard, 'weekend_days') and guard.weekend_days:
        # Parse as comma-separated string
        day_map = {'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6}
        weekend_days = [day_map[d.strip().lower()] for d in guard.weekend_days.split(',') if d.strip().lower() in day_map]

    for d in range(1, monthrange(year, month)[1] + 1):
        dt = date(year, month, d)
        key = dt.isoformat()
        if dt.weekday() in weekend_days:
            days[key] = 'weekend'
            weekends.append(dt.weekday())
        else:
            # Find attendance for this day
            att = [a for a in attendances if a.checkin_time.date() == dt]
            if att:
                # You can add more logic for late/half here
                days[key] = 'present'
            else:
                days[key] = 'absent'


    return Response({'days': days, 'weekends': weekend_days})

# Helper to get the guard object for the logged-in user


def get_guard_for_user(user):
    try:
        return Guard.objects.get(user=user)
    except Guard.DoesNotExist:
        return None


class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "guard":
            guard = get_guard_for_user(user)
            return Attendance.objects.filter(guard=guard)
        return Attendance.objects.filter(guard__organization=user.organization)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkin(request):
    serializer = CheckinSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        attendance = serializer.save()
        return Response(
            AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def checkout(request, attendance_id):
    user = request.user
    try:
        attendance = Attendance.objects.get(
            id=attendance_id,
            guard__organization=user.organization,
            checkout_time__isnull=True,
        )
        if user.role == "guard":
            guard = get_guard_for_user(user)
            if attendance.guard != guard:
                return Response(
                    {"error": "You can only checkout your own attendance."},
                    status=status.HTTP_403_FORBIDDEN,
                )
    except Attendance.DoesNotExist:
        return Response(
            {"error": "Active attendance not found"}, status=status.HTTP_404_NOT_FOUND
        )
    serializer = CheckoutSerializer(data=request.data)
    if serializer.is_valid():
        attendance.checkout_time = timezone.now()
        attendance.checkout_method = serializer.validated_data.get(
            "checkout_method", "manual"
        )
        attendance.checkout_latitude = serializer.validated_data.get(
            "checkout_latitude"
        )
        attendance.checkout_longitude = serializer.validated_data.get(
            "checkout_longitude"
        )
        if serializer.validated_data.get("notes"):
            attendance.notes = (
                (attendance.notes or "") + "\n" + serializer.validated_data["notes"]
            )
        attendance.save()
        return Response(AttendanceSerializer(attendance).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def active_attendances(request):
    user = request.user
    if user.role == "guard":
        guard = get_guard_for_user(user)
        active = Attendance.objects.filter(guard=guard, checkout_time__isnull=True)
    else:
        active = Attendance.objects.filter(
            guard__organization=user.organization, checkout_time__isnull=True
        )
    serializer = AttendanceSerializer(active, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def export_attendance(request):
    user = request.user
    if user.role == "guard":
        guard = get_guard_for_user(user)
        attendances = Attendance.objects.filter(guard=guard)
    else:
        attendances = Attendance.objects.filter(guard__organization=user.organization)
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="attendance_export.csv"'
    writer = csv.writer(response)
    writer.writerow(
        [
            "Guard Name",
            "Check-in Time",
            "Check-out Time",
            "Duration",
            "Check-in Method",
            "Check-out Method",
            "Notes",
        ]
    )
    for attendance in attendances:
        duration = str(attendance.duration) if attendance.duration else "N/A"
        writer.writerow(
            [
                attendance.guard.name,
                attendance.checkin_time,
                attendance.checkout_time or "N/A",
                duration,
                attendance.checkin_method,
                attendance.checkout_method,
                attendance.notes or "",
            ]
        )
    return response
