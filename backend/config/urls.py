"""
URL configuration for Personal Task Manager project.
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/tags/', include('apps.tags.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
]

# Add debug toolbar URLs in development
try:
    from django.conf import settings
    if settings.DEBUG:
        try:
            import debug_toolbar
            urlpatterns = [
                path('__debug__/', include(debug_toolbar.urls)),
            ] + urlpatterns
        except ImportError:
            pass
        
        # Add API documentation URLs
        try:
            from drf_spectacular.views import (
                SpectacularAPIView,
                SpectacularSwaggerView,
            )
            urlpatterns += [
                path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
                path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
            ]
        except ImportError:
            pass
except Exception:
    pass
