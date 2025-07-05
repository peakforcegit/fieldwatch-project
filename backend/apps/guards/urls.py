from django.urls import path
from . import views

urlpatterns = [
    path('', views.GuardListCreateView.as_view(), name='guard-list-create'),
    path('<int:pk>/', views.GuardDetailView.as_view(), name='guard-detail'),
]

