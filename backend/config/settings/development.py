"""
Django development settings for Personal Task Manager project.
"""

import os

from .base import *  # noqa: F401, F403

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-dev-key-change-in-production-12345'
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database
# Using PostgreSQL for development (matches production)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'taskmanager'),
        'USER': os.environ.get('POSTGRES_USER', 'taskmanager_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'taskmanager_password'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

CORS_ALLOW_CREDENTIALS = True

# Add browsable API renderer for development
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
}

# Debug toolbar (optional - only if installed)
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1']
except ImportError:
    pass

# DRF Spectacular for API documentation (optional)
try:
    import drf_spectacular  # noqa: F401
    INSTALLED_APPS += ['drf_spectacular']  # noqa: F405
    REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema'
    
    SPECTACULAR_SETTINGS = {
        'TITLE': 'Personal Task Manager API',
        'DESCRIPTION': 'API for managing personal tasks',
        'VERSION': '1.0.0',
        'SERVE_INCLUDE_SCHEMA': False,
    }
except ImportError:
    pass
