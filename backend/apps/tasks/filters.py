"""
Filters for Task model.
"""

from django_filters import rest_framework as filters

from .models import Task


class TaskFilter(filters.FilterSet):
    """Filter for Task model."""

    # Status filter
    status = filters.ChoiceFilter(choices=Task.Status.choices)

    # Priority filter
    priority = filters.ChoiceFilter(choices=Task.Priority.choices)

    # Date range filters
    due_date_after = filters.DateTimeFilter(
        field_name='due_date',
        lookup_expr='gte',
        help_text='Filter tasks with due date on or after this date',
    )
    due_date_before = filters.DateTimeFilter(
        field_name='due_date',
        lookup_expr='lte',
        help_text='Filter tasks with due date on or before this date',
    )

    created_after = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text='Filter tasks created on or after this date',
    )
    created_before = filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text='Filter tasks created on or before this date',
    )

    # Boolean filters
    is_overdue = filters.BooleanFilter(
        method='filter_is_overdue',
        help_text='Filter overdue tasks (due_date in past, not completed)',
    )
    has_due_date = filters.BooleanFilter(
        method='filter_has_due_date',
        help_text='Filter tasks that have/don\'t have a due date',
    )

    class Meta:
        model = Task
        fields = [
            'status',
            'priority',
            'due_date_after',
            'due_date_before',
            'created_after',
            'created_before',
            'is_overdue',
            'has_due_date',
        ]

    def filter_is_overdue(self, queryset, name, value):
        """Filter by overdue status."""
        from django.utils import timezone

        if value is True:
            return queryset.filter(
                due_date__lt=timezone.now()
            ).exclude(status=Task.Status.COMPLETED)
        elif value is False:
            return queryset.exclude(
                due_date__lt=timezone.now()
            ) | queryset.filter(status=Task.Status.COMPLETED)
        return queryset

    def filter_has_due_date(self, queryset, name, value):
        """Filter by presence of due date."""
        if value is True:
            return queryset.exclude(due_date__isnull=True)
        elif value is False:
            return queryset.filter(due_date__isnull=True)
        return queryset
