from django.urls import path
from . import views

urlpatterns = [
    path('', views.AttendanceListView.as_view(), name='attendance-list'),
    path('checkin/', views.checkin, name='checkin'),
    path('checkout/<int:attendance_id>/', views.checkout, name='checkout'),
    path('active/', views.active_attendances, name='active-attendances'),
    path('export/', views.export_attendance, name='export-attendance'),
    path('summary/', views.attendance_summary, name='attendance-summary'),
]

