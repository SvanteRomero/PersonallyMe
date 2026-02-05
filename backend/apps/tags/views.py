"""
Views for Tag management.
"""

import logging

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Tag
from .serializers import TagSerializer

logger = logging.getLogger(__name__)


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tag management.
    
    list: GET /api/tags/ - List user's tags (predefined + custom)
    create: POST /api/tags/ - Create custom tag
    retrieve: GET /api/tags/{id}/ - Get specific tag
    update: PUT /api/tags/{id}/ - Update tag
    destroy: DELETE /api/tags/{id}/ - Delete tag
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TagSerializer

    def get_queryset(self):
        """Return tags for the authenticated user and predefined tags."""
        user = self.request.user
        return Tag.objects.filter(Q(user=user) | Q(is_predefined=True)).distinct()

    def perform_create(self, serializer):
        """Set user when creating usage tag."""
        # Ensure predefined tags exist for user when they start using tags
        # (This is a failsafe if they weren't created on signup)
        if not Tag.objects.filter(user=self.request.user, is_predefined=True).exists():
            Tag.create_predefined_for_user(self.request.user)
            
        serializer.save(user=self.request.user, is_predefined=False)
        logger.info(f'Tag created by user {self.request.user.email}: {serializer.instance.name}')

    def perform_destroy(self, instance):
        """Prevent deleting predefined tags."""
        if instance.is_predefined:
            # Although permission classes handle auth, this is business logic
            raise PermissionDenied("Cannot delete predefined tags.")
        
        instance.delete()
        logger.info(f'Tag deleted by user {self.request.user.email}: {instance.name}')
