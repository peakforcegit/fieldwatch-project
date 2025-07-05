from django.urls import path
from . import views

urlpatterns = [
    path(
        "locations/",
        views.LocationLogListCreateView.as_view(),
        name="location-list-create",
    ),
    path("live/", views.live_locations, name="live-locations"),
    path("live-locations/", views.live_locations, name="live-locations-alias"),
    path("guard/<int:guard_id>/", views.guard_track, name="guard-track"),
]
