"""
URL configuration for tags app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TagViewSet

app_name = 'tags'

router = DefaultRouter()
router.register('', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]
