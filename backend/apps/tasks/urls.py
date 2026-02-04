"""
URL configuration for tasks app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TagViewSet, TaskViewSet

app_name = 'tasks'

router = DefaultRouter()
router.register('tags', TagViewSet, basename='tag')
router.register('tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
