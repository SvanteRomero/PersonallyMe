"""
Tag model for Personal Task Manager.
"""

from django.conf import settings
from django.db import models


class TagQuerySet(models.QuerySet):
    """Custom QuerySet for Tag model."""

    def for_user(self, user):
        """Return tags for a specific user."""
        return self.filter(user=user)

    def predefined(self):
        """Return only predefined tags."""
        return self.filter(is_predefined=True)

    def custom(self):
        """Return only custom (user-created) tags."""
        return self.filter(is_predefined=False)


class TagManager(models.Manager):
    """Custom manager for Tag model."""

    def get_queryset(self):
        return TagQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Tag(models.Model):
    """
    Tag model for categorizing tasks.
    Users can have predefined tags and create custom tags.
    """

    # Predefined tag colors
    PREDEFINED_TAGS = [
        {'name': 'Work', 'color': '#3B82F6'},       # Blue
        {'name': 'Personal', 'color': '#10B981'},   # Green
        {'name': 'Urgent', 'color': '#EF4444'},     # Red
        {'name': 'Important', 'color': '#F59E0B'},  # Amber
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags',
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')  # Hex color
    is_predefined = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = TagManager()

    class Meta:
        verbose_name = 'tag'
        verbose_name_plural = 'tags'
        ordering = ['name']
        unique_together = ['user', 'name']
        indexes = [
            models.Index(fields=['user', 'is_predefined']),
        ]

    def __str__(self):
        return self.name

    @classmethod
    def create_predefined_for_user(cls, user):
        """Create predefined tags for a new user."""
        tags = []
        for tag_data in cls.PREDEFINED_TAGS:
            tag, created = cls.objects.get_or_create(
                user=user,
                name=tag_data['name'],
                defaults={
                    'color': tag_data['color'],
                    'is_predefined': True,
                }
            )
            tags.append(tag)
        return tags
