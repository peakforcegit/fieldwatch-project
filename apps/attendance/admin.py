from django.contrib import admin
from .models import *
from django.utils import timezone


# Custom admin action for force check-out
def force_checkout(modeladmin, request, queryset):
    count = 0
    for attendance in queryset:
        if attendance.checkout_time is None:
            attendance.checkout_time = timezone.now()
            attendance.checkout_method = "admin"
            attendance.save()
            count += 1
    modeladmin.message_user(request, f"Force checked out {count} attendances.")


force_checkout.short_description = "Force check-out selected attendances"


class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "guard",
        "shift",
        "checkin_time",
        "checkout_time",
        "checkin_method",
        "checkout_method",
    )
    list_filter = ("checkout_time", "shift", "guard")
    actions = [force_checkout]


# Register Attendance with custom admin
admin.site.register(Attendance, AttendanceAdmin)

# Register all other models as before
for model in [
    m
    for n, m in globals().items()
    if hasattr(m, "__module__")
    and m.__module__.endswith(".models")
    and m is not Attendance
]:
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass
