from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('recent-urls/', views.recent_urls, name='recent_urls'),
    path("edit-short-url/<int:pk>/", views.edit_short_url, name="edit_short_url"),
    path("edit-long-url/<int:pk>/", views.edit_long_url, name="edit_long_url"),
    # This pattern should be last so it doesn't catch other paths like /admin
    path('<str:short_code>/', views.redirect_view, name='redirect'),
]