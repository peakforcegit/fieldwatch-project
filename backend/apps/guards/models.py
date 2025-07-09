from django.db import models
from apps.authentication.models import Organization, User
from django.contrib.postgres.fields import ArrayField
 # Removed direct import to avoid circular import

DAYS_OF_WEEK = [
    ("monday", "Monday"),
    ("tuesday", "Tuesday"),
    ("wednesday", "Wednesday"),
    ("thursday", "Thursday"),
    ("friday", "Friday"),
    ("saturday", "Saturday"),
    ("sunday", "Sunday"),
]

class Guard(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='guards')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='guard_profile')
    assigned_route = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    # Geofence fields
    geofence_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    geofence_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    geofence_radius_m = models.PositiveIntegerField(null=True, blank=True, help_text='Radius in meters')
    # Use TextField to store comma-separated days (for MySQL compatibility)
    weekend_days = models.TextField(blank=True, default='')
    shifts = models.ManyToManyField('attendance.Shift', related_name='guards', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.organization.name}"

    class Meta:
        unique_together = ['phone', 'organization']

