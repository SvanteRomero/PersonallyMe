"""
Views for Task management.
"""

import logging

import logging

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tags.models import Tag
from .filters import TaskFilter
from .models import Task
from .serializers import (
    BulkTaskActionSerializer,
    TaskCreateSerializer,
    TaskListSerializer,
    TaskSerializer,
)

logger = logging.getLogger(__name__)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    
    list: GET /api/tasks/ - List all active tasks for the authenticated user
    create: POST /api/tasks/ - Create a new task
    retrieve: GET /api/tasks/{id}/ - Get a specific task
    update: PUT /api/tasks/{id}/ - Update a task
    partial_update: PATCH /api/tasks/{id}/ - Partially update a task
    destroy: DELETE /api/tasks/{id}/ - Soft delete a task
    """
    
    permission_classes = [IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ['title', 'description', 'tags__name']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return tasks for the authenticated user only."""
        user = self.request.user
        
        # For deleted action, show deleted tasks
        if self.action == 'deleted':
            return Task.objects.filter(user=user, is_deleted=True)
        
        # For restore action, we need to access deleted tasks
        if self.action == 'restore':
            return Task.objects.filter(user=user)
        
        # Default: show only active (non-deleted) tasks
        return Task.objects.filter(user=user, is_deleted=False)

    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'list':
            return TaskListSerializer
        if self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        """Set the user when creating a task."""
        serializer.save(user=self.request.user)
        
        # Also ensure predefined tags exist
        if not Tag.objects.filter(user=self.request.user, is_predefined=True).exists():
            Tag.create_predefined_for_user(self.request.user)
            
        logger.info(f'Task created by user {self.request.user.email}: {serializer.instance.title}')

    def perform_update(self, serializer):
        """Handle task updates, including completion of recurring tasks."""
        # Check if status is changing to completed
        instance = serializer.instance
        new_status = serializer.validated_data.get('status')
        
        if new_status == Task.Status.COMPLETED and instance.status != Task.Status.COMPLETED:
            if instance.is_recurring:
                # This logic is complicated because the viewset update updates the instance directly.
                # But our model logic creates specific side effects.
                # We'll save normally first
                updated_task = serializer.save()
                
                # Then trigger recurrence logic
                next_task = updated_task.complete_recurring_task()
                
                if next_task and next_task != updated_task:
                    logger.info(f'Recurring task created: {next_task.title} for user {self.request.user.email}')
                return

        serializer.save()

    def perform_destroy(self, instance):
        """Soft delete instead of hard delete."""
        instance.soft_delete()
        logger.info(f'Task soft-deleted by user {self.request.user.email}: {instance.title}')

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        """
        List all deleted tasks.
        
        GET /api/tasks/deleted/
        """
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TaskListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore a soft-deleted task.
        
        POST /api/tasks/{id}/restore/
        """
        task = self.get_object()
        
        if not task.is_deleted:
            return Response(
                {'error': 'Task is not deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.restore()
        logger.info(f'Task restored by user {request.user.email}: {task.title}')
        
        return Response(
            {'message': 'Task restored successfully.', 'task': TaskSerializer(task).data},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get task statistics for the authenticated user.
        
        GET /api/tasks/stats/
        """
        user = request.user
        active_tasks = Task.objects.filter(user=user, is_deleted=False)
        
        stats = {
            'total': active_tasks.count(),
            'by_status': {
                'todo': active_tasks.filter(status=Task.Status.TODO).count(),
                'in_progress': active_tasks.filter(status=Task.Status.IN_PROGRESS).count(),
                'completed': active_tasks.filter(status=Task.Status.COMPLETED).count(),
            },
            'by_priority': {
                'low': active_tasks.filter(priority=Task.Priority.LOW).count(),
                'medium': active_tasks.filter(priority=Task.Priority.MEDIUM).count(),
                'high': active_tasks.filter(priority=Task.Priority.HIGH).count(),
            },
            'overdue': active_tasks.filter(
                due_date__lt=timezone.now()
            ).exclude(status=Task.Status.COMPLETED).count(),
            'deleted': Task.objects.filter(user=user, is_deleted=True).count(),
        }
        
        return Response(stats)

    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """
        Perform bulk actions on multiple tasks.
        
        POST /api/tasks/bulk_action/
        {
            "task_ids": [1, 2, 3],
            "action": "delete" | "restore" | "complete" | "set_priority" | "set_status",
            "value": "high" (only for set_priority and set_status)
        }
        """
        serializer = BulkTaskActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        action_type = serializer.validated_data['action']
        value = serializer.validated_data.get('value')
        
        # Get tasks belonging to the user
        tasks = Task.objects.filter(user=request.user, id__in=task_ids)
        
        if tasks.count() == 0:
            return Response(
                {'error': 'No valid tasks found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        
        if action_type == 'delete':
            for task in tasks.filter(is_deleted=False):
                task.soft_delete()
                updated_count += 1
        elif action_type == 'restore':
            for task in tasks.filter(is_deleted=True):
                task.restore()
                updated_count += 1
        elif action_type == 'complete':
            # Handle recurrence logic for bulk complete
            for task in tasks.filter(is_deleted=False):
                if task.status != Task.Status.COMPLETED:
                    task.status = Task.Status.COMPLETED
                    task.updated_at = timezone.now()
                    task.save()
                    if task.is_recurring:
                        task.complete_recurring_task()
                    updated_count += 1
        elif action_type == 'set_priority':
            updated_count = tasks.filter(is_deleted=False).update(
                priority=value,
                updated_at=timezone.now()
            )
        elif action_type == 'set_status':
            # For set_status, we need to loop if setting to completed to handle recurrence
            if value == Task.Status.COMPLETED:
                for task in tasks.filter(is_deleted=False):
                    if task.status != Task.Status.COMPLETED:
                        task.status = Task.Status.COMPLETED
                        task.updated_at = timezone.now()
                        task.save()
                        if task.is_recurring:
                            task.complete_recurring_task()
                        updated_count += 1
            else:
                updated_count = tasks.filter(is_deleted=False).update(
                    status=value,
                    updated_at=timezone.now()
                )
        
        logger.info(
            f'Bulk action "{action_type}" performed by user {request.user.email} '
            f'on {updated_count} tasks'
        )
        
        return Response({
            'message': f'Successfully performed "{action_type}" on {updated_count} tasks.',
            'updated_count': updated_count,
        })
