from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("profile/", views.profile, name="profile"),
    path("change-password/", views.change_password, name="change_password"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/", views.user_management, name="user_management"),
    path("users/<int:user_id>/", views.user_detail, name="user_detail"),
]
