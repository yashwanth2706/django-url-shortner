from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    # This pattern should be last so it doesn't catch other paths like /admin
    path('<str:short_code>/', views.redirect_view, name='redirect'),
]