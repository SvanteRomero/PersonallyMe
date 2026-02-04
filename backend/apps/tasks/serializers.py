"""
Serializers for Task model.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""

    is_overdue = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'is_deleted',
            'deleted_at',
            'created_at',
            'updated_at',
            'user_email',
        ]
        read_only_fields = [
            'id',
            'is_deleted',
            'deleted_at',
            'created_at',
            'updated_at',
            'user_email',
        ]

    def validate_title(self, value):
        """Validate title is not empty after stripping whitespace."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Title cannot be empty.')
        return value

    def validate_due_date(self, value):
        """Validate due_date is not in the past for new tasks."""
        if value:
            # Only check for new tasks, allow past dates for updates
            if self.instance is None and value < timezone.now():
                raise serializers.ValidationError(
                    'Due date cannot be in the past for new tasks.'
                )
        return value

    def validate_status(self, value):
        """Validate status is a valid choice."""
        if value not in dict(Task.Status.choices):
            raise serializers.ValidationError(
                f'Invalid status. Must be one of: {list(dict(Task.Status.choices).keys())}'
            )
        return value

    def validate_priority(self, value):
        """Validate priority is a valid choice."""
        if value not in dict(Task.Priority.choices):
            raise serializers.ValidationError(
                f'Invalid priority. Must be one of: {list(dict(Task.Priority.choices).keys())}'
            )
        return value


class TaskCreateSerializer(TaskSerializer):
    """Serializer for creating tasks."""

    class Meta(TaskSerializer.Meta):
        fields = [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists."""

    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'created_at',
        ]


class TaskRestoreSerializer(serializers.Serializer):
    """Serializer for task restore action."""

    pass  # No input needed


class BulkTaskActionSerializer(serializers.Serializer):
    """Serializer for bulk task actions."""

    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100,
    )
    action = serializers.ChoiceField(
        choices=['delete', 'restore', 'complete', 'set_priority', 'set_status']
    )
    value = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate action-specific requirements."""
        action = attrs.get('action')
        value = attrs.get('value')

        if action == 'set_priority' and value not in dict(Task.Priority.choices):
            raise serializers.ValidationError({
                'value': f'Invalid priority. Must be one of: {list(dict(Task.Priority.choices).keys())}'
            })

        if action == 'set_status' and value not in dict(Task.Status.choices):
            raise serializers.ValidationError({
                'value': f'Invalid status. Must be one of: {list(dict(Task.Status.choices).keys())}'
            })

        return attrs
