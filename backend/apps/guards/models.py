from django.db import models
from apps.authentication.models import Organization, User

class Guard(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='guards')
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='guard_profile')
    assigned_route = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.organization.name}"

    class Meta:
        unique_together = ['phone', 'organization']

