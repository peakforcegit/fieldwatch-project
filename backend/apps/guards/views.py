from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import Guard
from .serializers import GuardSerializer, GuardCreateSerializer

class GuardListCreateView(generics.ListCreateAPIView):
    serializer_class = GuardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Guard.objects.filter(organization=self.request.user.organization)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GuardCreateSerializer
        return GuardSerializer

class GuardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GuardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Guard.objects.filter(organization=self.request.user.organization)

