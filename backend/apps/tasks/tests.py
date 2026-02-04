"""
Tests for tasks app - core CRUD and permission functionality.
"""

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .models import Task

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user(db):
    def _create_user(email='test@example.com', password='SecurePass123!', **kwargs):
        return User.objects.create_user(
            email=email,
            password=password,
            first_name=kwargs.get('first_name', 'Test'),
            last_name=kwargs.get('last_name', 'User'),
        )
    return _create_user


@pytest.fixture
def authenticated_client(api_client, create_user):
    """Return an authenticated API client."""
    user = create_user()
    login_url = reverse('users:login')
    response = api_client.post(login_url, {
        'email': user.email,
        'password': 'SecurePass123!',
    }, format='json')
    access_token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    api_client.user = user
    return api_client


@pytest.fixture
def create_task(db):
    def _create_task(user, **kwargs):
        return Task.objects.create(
            user=user,
            title=kwargs.get('title', 'Test Task'),
            description=kwargs.get('description', 'Test description'),
            status=kwargs.get('status', Task.Status.TODO),
            priority=kwargs.get('priority', Task.Priority.MEDIUM),
            due_date=kwargs.get('due_date'),
            is_deleted=kwargs.get('is_deleted', False),
        )
    return _create_task


@pytest.mark.django_db
class TestTaskCRUD:
    """Tests for Task CRUD operations."""

    def test_create_task_success(self, authenticated_client):
        """Test successful task creation."""
        url = reverse('tasks:task-list')
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'status': 'todo',
            'priority': 'high',
            'due_date': (timezone.now() + timedelta(days=7)).isoformat(),
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'New Task'
        assert Task.objects.filter(title='New Task').exists()

    def test_create_task_without_due_date(self, authenticated_client):
        """Test task creation without due date."""
        url = reverse('tasks:task-list')
        data = {
            'title': 'Task Without Due Date',
            'status': 'todo',
            'priority': 'medium',
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['due_date'] is None

    def test_create_task_past_due_date_fails(self, authenticated_client):
        """Test task creation with past due date fails."""
        url = reverse('tasks:task-list')
        data = {
            'title': 'Past Task',
            'due_date': (timezone.now() - timedelta(days=1)).isoformat(),
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_tasks(self, authenticated_client, create_task):
        """Test listing tasks."""
        create_task(authenticated_client.user, title='Task 1')
        create_task(authenticated_client.user, title='Task 2')
        
        url = reverse('tasks:task-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_retrieve_task(self, authenticated_client, create_task):
        """Test retrieving a specific task."""
        task = create_task(authenticated_client.user)
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == task.title

    def test_update_task(self, authenticated_client, create_task):
        """Test updating a task."""
        task = create_task(authenticated_client.user)
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = authenticated_client.patch(url, {
            'title': 'Updated Title',
            'status': 'in_progress',
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Title'
        assert response.data['status'] == 'in_progress'

    def test_soft_delete_task(self, authenticated_client, create_task):
        """Test soft deleting a task."""
        task = create_task(authenticated_client.user)
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Task should still exist but be marked as deleted
        task.refresh_from_db()
        assert task.is_deleted is True
        assert task.deleted_at is not None


@pytest.mark.django_db
class TestTaskFiltering:
    """Tests for task filtering."""

    def test_filter_by_status(self, authenticated_client, create_task):
        """Test filtering tasks by status."""
        create_task(authenticated_client.user, title='Todo Task', status=Task.Status.TODO)
        create_task(authenticated_client.user, title='Completed Task', status=Task.Status.COMPLETED)
        
        url = reverse('tasks:task-list')
        response = authenticated_client.get(url, {'status': 'todo'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'Todo Task'

    def test_filter_by_priority(self, authenticated_client, create_task):
        """Test filtering tasks by priority."""
        create_task(authenticated_client.user, title='High Priority', priority=Task.Priority.HIGH)
        create_task(authenticated_client.user, title='Low Priority', priority=Task.Priority.LOW)
        
        url = reverse('tasks:task-list')
        response = authenticated_client.get(url, {'priority': 'high'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'High Priority'

    def test_search_tasks(self, authenticated_client, create_task):
        """Test searching tasks by title."""
        create_task(authenticated_client.user, title='Find this task')
        create_task(authenticated_client.user, title='Another task')
        
        url = reverse('tasks:task-list')
        response = authenticated_client.get(url, {'search': 'Find'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert 'Find' in response.data['results'][0]['title']


@pytest.mark.django_db
class TestTaskPermissions:
    """Tests for task permission isolation."""

    def test_user_cannot_access_other_users_tasks(self, api_client, create_user, create_task):
        """Test that users cannot access other users' tasks."""
        user1 = create_user(email='user1@example.com')
        user2 = create_user(email='user2@example.com')
        
        # Create task for user1
        task = create_task(user1, title='User1 Task')
        
        # Login as user2
        login_url = reverse('users:login')
        response = api_client.post(login_url, {
            'email': user2.email,
            'password': 'SecurePass123!',
        }, format='json')
        access_token = response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Try to access user1's task
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_sees_only_own_tasks_in_list(self, api_client, create_user, create_task):
        """Test that task list shows only user's own tasks."""
        user1 = create_user(email='user1@example.com')
        user2 = create_user(email='user2@example.com')
        
        create_task(user1, title='User1 Task')
        create_task(user2, title='User2 Task')
        
        # Login as user1
        login_url = reverse('users:login')
        response = api_client.post(login_url, {
            'email': user1.email,
            'password': 'SecurePass123!',
        }, format='json')
        access_token = response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # List tasks
        url = reverse('tasks:task-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'User1 Task'


@pytest.mark.django_db
class TestTaskSoftDelete:
    """Tests for soft delete and restore functionality."""

    def test_deleted_tasks_not_in_list(self, authenticated_client, create_task):
        """Test that deleted tasks don't appear in regular list."""
        create_task(authenticated_client.user, title='Active Task')
        create_task(authenticated_client.user, title='Deleted Task', is_deleted=True)
        
        url = reverse('tasks:task-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'Active Task'

    def test_deleted_endpoint(self, authenticated_client, create_task):
        """Test deleted tasks endpoint."""
        create_task(authenticated_client.user, title='Active Task')
        create_task(authenticated_client.user, title='Deleted Task', is_deleted=True)
        
        url = reverse('tasks:task-deleted')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'Deleted Task'

    def test_restore_task(self, authenticated_client, create_task):
        """Test restoring a deleted task."""
        task = create_task(authenticated_client.user, is_deleted=True)
        url = reverse('tasks:task-restore', kwargs={'pk': task.id})
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        task.refresh_from_db()
        assert task.is_deleted is False
        assert task.deleted_at is None


@pytest.mark.django_db
class TestTaskStats:
    """Tests for task statistics endpoint."""

    def test_stats_endpoint(self, authenticated_client, create_task):
        """Test getting task statistics."""
        create_task(authenticated_client.user, status=Task.Status.TODO, priority=Task.Priority.HIGH)
        create_task(authenticated_client.user, status=Task.Status.COMPLETED, priority=Task.Priority.LOW)
        create_task(authenticated_client.user, is_deleted=True)
        
        url = reverse('tasks:task-stats')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 2  # Only active tasks
        assert response.data['by_status']['todo'] == 1
        assert response.data['by_status']['completed'] == 1
        assert response.data['by_priority']['high'] == 1
        assert response.data['by_priority']['low'] == 1
        assert response.data['deleted'] == 1
