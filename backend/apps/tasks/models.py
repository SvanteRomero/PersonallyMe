"""
Task model for Personal Task Manager.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class TaskQuerySet(models.QuerySet):
    """Custom QuerySet for Task model."""

    def active(self):
        """Return only non-deleted tasks."""
        return self.filter(is_deleted=False)

    def deleted(self):
        """Return only deleted tasks."""
        return self.filter(is_deleted=True)

    def for_user(self, user):
        """Return tasks for a specific user."""
        return self.filter(user=user)

    def by_status(self, status):
        """Filter by status."""
        return self.filter(status=status)

    def by_priority(self, priority):
        """Filter by priority."""
        return self.filter(priority=priority)

    def overdue(self):
        """Return overdue tasks (due_date in the past, not completed)."""
        return self.filter(
            due_date__lt=timezone.now(),
            is_deleted=False
        ).exclude(status='completed')


class TaskManager(models.Manager):
    """Custom manager for Task model."""

    def get_queryset(self):
        return TaskQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def deleted(self):
        return self.get_queryset().deleted()

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Task(models.Model):
    """
    Task model with soft delete functionality.
    """

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    # Core fields
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    
    # Dates
    due_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    objects = TaskManager()

    class Meta:
        verbose_name = 'task'
        verbose_name_plural = 'tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_deleted']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return self.title

    def soft_delete(self):
        """Mark task as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted task."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    @property
    def is_overdue(self):
        """Check if task is overdue."""
        if self.due_date and self.status != self.Status.COMPLETED:
            return timezone.now() > self.due_date
        return False
