from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta, datetime
from .models import Alert
from .serializers import AlertSerializer, AlertCreateSerializer
from apps.attendance.models import Attendance
from apps.tracking.models import LocationLog
from apps.guards.models import Guard

# Helper to get the guard object for the logged-in user
def get_guard_for_user(user):
    try:
        return Guard.objects.get(user=user)
    except Guard.DoesNotExist:
        return None

class AlertListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'guard':
            guard = get_guard_for_user(user)
            return Alert.objects.filter(guard=guard)
        return Alert.objects.filter(guard__organization=user.organization)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AlertCreateSerializer
        return AlertSerializer

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resolve_alert(request, alert_id):
    user = request.user
    try:
        alert = Alert.objects.get(id=alert_id, guard__organization=user.organization)
        if user.role == 'guard':
            guard = get_guard_for_user(user)
            if alert.guard != guard:
                return Response({'error': 'You can only resolve your own alerts.'}, status=status.HTTP_403_FORBIDDEN)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)
    alert.is_resolved = True
    alert.resolved_at = timezone.now()
    alert.resolved_by = user.username
    alert.save()
    return Response(AlertSerializer(alert).data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_analytics(request):
    """Get dashboard analytics data"""
    org = request.user.organization
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    user = request.user
    if user.role == 'guard':
        guard = get_guard_for_user(user)
        # Only show stats for this guard
        total_guards = 1
        active_guards = Attendance.objects.filter(guard=guard, checkout_time__isnull=True).count()
        today_attendance = Attendance.objects.filter(guard=guard, checkin_time__date=today).count()
        unresolved_alerts = Alert.objects.filter(guard=guard, is_resolved=False).count()
        critical_alerts = Alert.objects.filter(guard=guard, is_resolved=False, severity='critical').count()
        weekly_attendance = []
        for i in range(7):
            date = today - timedelta(days=i)
            count = Attendance.objects.filter(guard=guard, checkin_time__date=date).count()
            weekly_attendance.append({'date': date.strftime('%Y-%m-%d'), 'count': count})
        alert_distribution = Alert.objects.filter(guard=guard, created_at__gte=month_ago).values('alert_type').annotate(count=Count('id'))
        return Response({
            'total_guards': total_guards,
            'active_guards': active_guards,
            'today_attendance': today_attendance,
            'unresolved_alerts': unresolved_alerts,
            'critical_alerts': critical_alerts,
            'weekly_attendance': weekly_attendance,
            'alert_distribution': list(alert_distribution)
        })
    # Default org-wide analytics for admin/manager
    # ... existing code ...

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def monthly_report(request):
    """Get monthly analytics report"""
    org = request.user.organization
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Monthly attendance summary
    monthly_attendance = Attendance.objects.filter(
        guard__organization=org,
        checkin_time__gte=month_start
    )
    
    # Guard performance
    guard_stats = []
    for guard in org.guards.filter(is_active=True):
        attendance_count = monthly_attendance.filter(guard=guard).count()
        total_hours = sum([
            (att.duration.total_seconds() / 3600) if att.duration else 0
            for att in monthly_attendance.filter(guard=guard)
        ])
        
        guard_stats.append({
            'guard_name': guard.name,
            'attendance_days': attendance_count,
            'total_hours': round(total_hours, 2),
            'avg_hours_per_day': round(total_hours / max(attendance_count, 1), 2)
        })
    
    # Alert summary
    monthly_alerts = Alert.objects.filter(
        guard__organization=org,
        created_at__gte=month_start
    )
    
    alert_summary = {
        'total_alerts': monthly_alerts.count(),
        'resolved_alerts': monthly_alerts.filter(is_resolved=True).count(),
        'by_type': list(monthly_alerts.values('alert_type').annotate(count=Count('id'))),
        'by_severity': list(monthly_alerts.values('severity').annotate(count=Count('id')))
    }
    
    return Response({
        'period': f"{month_start.strftime('%B %Y')}",
        'guard_performance': guard_stats,
        'alert_summary': alert_summary,
        'total_attendance_days': monthly_attendance.count(),
        'average_daily_attendance': round(monthly_attendance.count() / now.day, 2)
    })

