from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.attendance.models import Attendance
from apps.tracking.models import LocationLog
from math import radians, cos, sin, asin, sqrt


# Haversine formula to calculate distance between two lat/lng points in meters
def haversine(lat1, lon1, lat2, lon2):
    # convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Radius of earth in meters
    return c * r


class Command(BaseCommand):
    help = "Auto check-out all active attendances whose shift end time has passed or guard has left geofence."

    def handle(self, *args, **options):
        now = timezone.localtime()
        count = 0
        geo_count = 0
        active_attendances = Attendance.objects.filter(
            checkout_time__isnull=True, shift__isnull=False
        )
        for attendance in active_attendances:
            shift = attendance.shift
            guard = attendance.guard
            if not shift:
                continue
            # Calculate shift end datetime for the attendance date
            shift_start = timezone.make_aware(
                timezone.datetime.combine(
                    attendance.checkin_time.date(), shift.start_time
                )
            )
            shift_end = timezone.make_aware(
                timezone.datetime.combine(
                    attendance.checkin_time.date(), shift.end_time
                )
            )
            # Handle overnight shifts
            if shift_end <= shift_start:
                shift_end += timezone.timedelta(days=1)
            # 1. Auto check-out if shift end time has passed
            if now >= shift_end:
                attendance.checkout_time = shift_end
                attendance.checkout_method = "auto"
                attendance.save()
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Auto checked out attendance ID {attendance.id} at {shift_end} (shift end)"
                    )
                )
                continue
            # 2. Auto check-out if guard has left geofence
            if (
                guard.geofence_latitude
                and guard.geofence_longitude
                and guard.geofence_radius_m
            ):
                latest_log = guard.location_logs.order_by("-timestamp").first()
                if latest_log:
                    dist = haversine(
                        guard.geofence_latitude,
                        guard.geofence_longitude,
                        latest_log.latitude,
                        latest_log.longitude,
                    )
                    if dist > guard.geofence_radius_m:
                        attendance.checkout_time = now
                        attendance.checkout_method = "geo"
                        attendance.save()
                        geo_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"Geo checked out attendance ID {attendance.id} at {now} (distance {dist:.2f}m > {guard.geofence_radius_m}m)"
                            )
                        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Auto check-out complete. Shift end: {count}, Geofence: {geo_count}"
            )
        )
