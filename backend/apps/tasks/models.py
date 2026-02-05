"""
Task and Tag models for Personal Task Manager.
"""

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tags.models import Tag


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

    def by_tag(self, tag_id):
        """Filter by tag."""
        return self.filter(tags__id=tag_id)

    def recurring(self):
        """Return only recurring tasks."""
        return self.exclude(recurrence_pattern='none')

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
    Task model with soft delete, tags, and recurrence functionality.
    """

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class RecurrencePattern(models.TextChoices):
        NONE = 'none', 'None'
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'

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
    
    # Tags (many-to-many)
    tags = models.ManyToManyField(Tag, related_name='tasks', blank=True)
    
    # Dates
    due_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Recurrence fields
    recurrence_pattern = models.CharField(
        max_length=10,
        choices=RecurrencePattern.choices,
        default=RecurrencePattern.NONE,
    )
    times_per_period = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of times to complete per period (e.g., 3 times per week)"
    )
    current_period_count = models.PositiveIntegerField(
        default=0,
        help_text="Tracks completions in current recurrence period"
    )
    period_start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Start date of current recurrence period"
    )
    parent_task = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='occurrences',
        help_text="Reference to parent recurring task"
    )
    keep_history = models.BooleanField(
        default=True,
        help_text="If True, completed occurrences remain visible; if False, task resets"
    )

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
            models.Index(fields=['recurrence_pattern']),
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

    @property
    def is_recurring(self):
        """Check if task has recurrence."""
        return self.recurrence_pattern != self.RecurrencePattern.NONE

    def _get_next_due_date(self):
        """Calculate the next due date based on recurrence pattern."""
        if not self.due_date:
            return None

        if self.recurrence_pattern == self.RecurrencePattern.DAILY:
            return self.due_date + timedelta(days=1)
        elif self.recurrence_pattern == self.RecurrencePattern.WEEKLY:
            return self.due_date + timedelta(weeks=1)
        elif self.recurrence_pattern == self.RecurrencePattern.MONTHLY:
            # Add approximately one month
            return self.due_date + timedelta(days=30)
        return None

    def _should_create_next_occurrence(self):
        """
        Determine if next occurrence should be created.
        Returns True if:
        - times_per_period is not set (unlimited), OR
        - current_period_count has reached times_per_period
        """
        if self.times_per_period is None:
            return True
        return self.current_period_count >= self.times_per_period

    def _reset_period_if_needed(self):
        """Reset period counter if we've entered a new period."""
        today = timezone.now().date()
        
        if not self.period_start_date:
            self.period_start_date = today
            self.current_period_count = 0
            return

        days_elapsed = (today - self.period_start_date).days
        
        if self.recurrence_pattern == self.RecurrencePattern.DAILY:
            if days_elapsed >= 1:
                self.period_start_date = today
                self.current_period_count = 0
        elif self.recurrence_pattern == self.RecurrencePattern.WEEKLY:
            if days_elapsed >= 7:
                self.period_start_date = today
                self.current_period_count = 0
        elif self.recurrence_pattern == self.RecurrencePattern.MONTHLY:
            if days_elapsed >= 30:
                self.period_start_date = today
                self.current_period_count = 0

    def complete_recurring_task(self):
        """
        Handle completion of a recurring task.
        Returns the next task instance (new or reset) if applicable, None otherwise.
        """
        if not self.is_recurring:
            return None

        self._reset_period_if_needed()
        self.current_period_count += 1

        if self._should_create_next_occurrence():
            next_due_date = self._get_next_due_date()
            
            if self.keep_history:
                # Create new task occurrence, keep original as completed
                next_task = Task.objects.create(
                    user=self.user,
                    title=self.title,
                    description=self.description,
                    priority=self.priority,
                    status=self.Status.TODO,
                    due_date=next_due_date,
                    recurrence_pattern=self.recurrence_pattern,
                    times_per_period=self.times_per_period,
                    keep_history=self.keep_history,
                    parent_task=self.parent_task or self,
                    period_start_date=timezone.now().date(),
                    current_period_count=0,
                )
                # Copy tags to new task
                next_task.tags.set(self.tags.all())
                self.save()  # Save the period count update
                return next_task
            else:
                # Reset same task to todo with new due date
                self.status = self.Status.TODO
                self.due_date = next_due_date
                self.period_start_date = timezone.now().date()
                self.current_period_count = 0
                self.save()
                return self
        else:
            # Just save the incremented counter
            self.save()
            return None
