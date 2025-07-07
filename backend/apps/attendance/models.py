from django.db import models
 # Removed direct import to avoid circular import
from apps.authentication.models import Organization


class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shifts')

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time}) - {self.organization.name}"


class Attendance(models.Model):
    METHOD_CHOICES = [
        ("manual", "Manual"),
        ("auto", "Automatic"),
    ]

    guard = models.ForeignKey(
        'guards.Guard', on_delete=models.CASCADE, related_name="attendances"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="attendances",
        null=True,
        blank=True,
    )
    shift = models.ForeignKey(
        Shift, on_delete=models.SET_NULL, null=True, blank=True, related_name="attendances"
    )
    checkin_time = models.DateTimeField()
    checkout_time = models.DateTimeField(null=True, blank=True)
    checkin_method = models.CharField(
        max_length=10, choices=METHOD_CHOICES, default="manual"
    )
    checkout_method = models.CharField(
        max_length=10, choices=METHOD_CHOICES, default="manual"
    )
    checkin_latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    checkin_longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    checkout_latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    checkout_longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.guard.name} - {self.checkin_time.date()} - {self.organization.name}"
        )

    @property
    def duration(self):
        if self.checkout_time:
            return self.checkout_time - self.checkin_time
        return None

    class Meta:
        ordering = ["-checkin_time"]
