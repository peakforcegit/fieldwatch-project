from django.db import models
from apps.guards.models import Guard
from apps.authentication.models import Organization


class LocationLog(models.Model):
    guard = models.ForeignKey(
        Guard, on_delete=models.CASCADE, related_name="location_logs"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="location_logs",
        null=True,
        blank=True,
    )
    latitude = models.DecimalField(max_digits=12, decimal_places=8)
    longitude = models.DecimalField(max_digits=12, decimal_places=8)
    timestamp = models.DateTimeField(auto_now_add=True)
    accuracy = models.FloatField(null=True, blank=True)
    battery_level = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.guard.name} - {self.timestamp} - {self.organization.name}"

    class Meta:
        ordering = ["-timestamp"]
