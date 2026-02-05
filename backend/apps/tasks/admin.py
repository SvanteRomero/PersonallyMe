"""
Admin configuration for tasks app.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import Task




@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Custom admin for Task model."""
    
    list_display = [
        'title',
        'user',
        'status_badge',
        'priority_badge',
        'recurrence_badge',
        'due_date',
        'is_deleted',
        'created_at',
    ]
    list_filter = ['status', 'priority', 'is_deleted', 'recurrence_pattern', 'created_at']
    search_fields = ['title', 'description', 'user__email', 'tags__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'deleted_at', 'current_period_count', 'period_start_date']
    filter_horizontal = ['tags']
    
    fieldsets = (
        (None, {
            'fields': ('user', 'title', 'description')
        }),
        ('Organization', {
            'fields': ('tags',),
        }),
        ('Status', {
            'fields': ('status', 'priority', 'due_date')
        }),
        ('Recurrence', {
            'fields': (
                'recurrence_pattern', 
                'times_per_period', 
                'keep_history', 
                'current_period_count', 
                'period_start_date'
            ),
            'classes': ('collapse',),
        }),
        ('Soft Delete', {
            'fields': ('is_deleted', 'deleted_at'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def status_badge(self, obj):
        """Display status as a colored badge."""
        colors = {
            'todo': '#6B7280',
            'in_progress': '#3B82F6',
            'completed': '#10B981',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def priority_badge(self, obj):
        """Display priority as a colored badge."""
        colors = {
            'low': '#10B981',
            'medium': '#F59E0B',
            'high': '#EF4444',
        }
        color = colors.get(obj.priority, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    priority_badge.admin_order_field = 'priority'
    
    def recurrence_badge(self, obj):
        """Display recurrence info."""
        if not obj.is_recurring:
            return '-'
        return f"{obj.get_recurrence_pattern_display()}" + (f" ({obj.times_per_period}x)" if obj.times_per_period else "")
    recurrence_badge.short_description = 'Recurrence'

    actions = ['soft_delete_tasks', 'restore_tasks', 'mark_completed']

    @admin.action(description='Soft delete selected tasks')
    def soft_delete_tasks(self, request, queryset):
        count = 0
        for task in queryset.filter(is_deleted=False):
            task.soft_delete()
            count += 1
        self.message_user(request, f'{count} tasks soft deleted.')

    @admin.action(description='Restore selected tasks')
    def restore_tasks(self, request, queryset):
        count = 0
        for task in queryset.filter(is_deleted=True):
            task.restore()
            count += 1
        self.message_user(request, f'{count} tasks restored.')

    @admin.action(description='Mark selected tasks as completed')
    def mark_completed(self, request, queryset):
        count = queryset.filter(is_deleted=False).update(status='completed')
        self.message_user(request, f'{count} tasks marked as completed.')
