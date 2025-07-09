from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.attendance.models import Attendance

class Command(BaseCommand):
    help = 'Auto check-out all active attendances whose shift end time has passed.'

    def handle(self, *args, **options):
        now = timezone.localtime()
        count = 0
        active_attendances = Attendance.objects.filter(checkout_time__isnull=True, shift__isnull=False)
        for attendance in active_attendances:
            shift = attendance.shift
            if not shift:
                continue
            # Calculate shift end datetime for the attendance date
            shift_start = timezone.make_aware(timezone.datetime.combine(attendance.checkin_time.date(), shift.start_time))
            shift_end = timezone.make_aware(timezone.datetime.combine(attendance.checkin_time.date(), shift.end_time))
            # Handle overnight shifts
            if shift_end <= shift_start:
                shift_end += timezone.timedelta(days=1)
            if now >= shift_end:
                attendance.checkout_time = shift_end
                attendance.checkout_method = 'auto'
                attendance.save()
                count += 1
                self.stdout.write(self.style.SUCCESS(f'Auto checked out attendance ID {attendance.id} at {shift_end}'))
        self.stdout.write(self.style.SUCCESS(f'Auto check-out complete. Total attendances checked out: {count}')) 