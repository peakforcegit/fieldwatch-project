from django.db import models
from apps.guards.models import Guard
from apps.authentication.models import Organization


class Alert(models.Model):
    ALERT_TYPES = [
        ("offline", "Offline"),
        ("geofence", "Geofence Violation"),
        ("battery_low", "Low Battery"),
        ("panic", "Panic Button"),
    ]

    SEVERITY_LEVELS = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    guard = models.ForeignKey(Guard, on_delete=models.CASCADE, related_name="alerts")
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="alerts", null=True, blank=True
    )
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(
        max_length=10, choices=SEVERITY_LEVELS, default="medium"
    )
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.guard.name} - {self.alert_type} - {self.created_at} - {self.organization.name}"

    class Meta:
        ordering = ["-created_at"]
