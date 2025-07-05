from django.urls import path
from . import views

urlpatterns = [
    path('alerts/', views.AlertListCreateView.as_view(), name='alert-list-create'),
    path('alerts/<int:alert_id>/resolve/', views.resolve_alert, name='resolve-alert'),
    path('dashboard/', views.dashboard_analytics, name='dashboard-analytics'),
    path('monthly/', views.monthly_report, name='monthly-report'),
]

