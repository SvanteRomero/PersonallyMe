"""
Serializers for Task model.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import Tag, Task


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'is_predefined']
        read_only_fields = ['id', 'is_predefined']

    def validate_name(self, value):
        """Validate tag name is not empty."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Tag name cannot be empty.')
        return value

    def validate_color(self, value):
        """Validate color is a valid hex code."""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError('Color must be a valid hex code (e.g., #FF0000).')
        return value


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""

    is_overdue = serializers.ReadOnlyField()
    is_recurring = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        source='tags',
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'tags',
            'tag_ids',
            'is_overdue',
            'is_deleted',
            'deleted_at',
            'created_at',
            'updated_at',
            'user_email',
            'recurrence_pattern',
            'times_per_period',
            'current_period_count',
            'period_start_date',
            'is_recurring',
            'keep_history',
        ]
        read_only_fields = [
            'id',
            'is_deleted',
            'deleted_at',
            'created_at',
            'updated_at',
            'user_email',
            'current_period_count',
            'period_start_date',
            'is_recurring',
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
            'tags',
            'tag_ids',
            'created_at',
            'recurrence_pattern',
            'times_per_period',
            'keep_history',
        ]
        read_only_fields = ['id', 'created_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists."""

    is_overdue = serializers.ReadOnlyField()
    is_recurring = serializers.ReadOnlyField()
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'is_recurring',
            'tags',
            'created_at',
            'recurrence_pattern',
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
