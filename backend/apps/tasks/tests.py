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

from .models import Tag, Task

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
            recurrence_pattern=kwargs.get('recurrence_pattern', Task.RecurrencePattern.NONE),
            times_per_period=kwargs.get('times_per_period'),
            keep_history=kwargs.get('keep_history', True),
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


@pytest.mark.django_db
class TestTags:
    """Tests for Tag functionality."""

    def test_predefined_tags_created_on_fetch(self, authenticated_client):
        """Test that fetching tags creates predefined ones if missing."""
        url = reverse('tasks:tag-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 4  # Should create 4 predefined tags
        
        # Verify specific tags exist
        tags = Tag.objects.filter(user=authenticated_client.user, is_predefined=True)
        assert tags.count() == 4
        assert tags.filter(name='Work').exists()
        assert tags.filter(name='Personal').exists()

    def test_create_custom_tag(self, authenticated_client):
        """Test user can create custom custom tags."""
        url = reverse('tasks:tag-list')
        data = {'name': 'Custom Tag', 'color': '#000000'}
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Custom Tag'
        assert not response.data['is_predefined']

    def test_cannot_delete_predefined_tag(self, authenticated_client):
        """Test preventing deletion of predefined tags."""
        # Ensure tags exist
        Tag.create_predefined_for_user(authenticated_client.user)
        tag = Tag.objects.filter(user=authenticated_client.user, is_predefined=True).first()
        
        url = reverse('tasks:tag-detail', kwargs={'pk': tag.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_custom_tag(self, authenticated_client):
        """Test deleting custom tags works."""
        tag = Tag.objects.create(user=authenticated_client.user, name='Custom', color='#123456')
        url = reverse('tasks:tag-detail', kwargs={'pk': tag.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_assign_tags_to_task(self, authenticated_client, create_task):
        """Test that tasks can have tags."""
        # Create tag first
        tag = Tag.objects.create(user=authenticated_client.user, name='Tag1')
        
        url = reverse('tasks:task-list')
        data = {
            'title': 'Tagged Task',
            'tag_ids': [tag.id]
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data['tags']) == 1
        assert response.data['tags'][0]['id'] == tag.id


@pytest.mark.django_db
class TestRecurringTasks:
    """Tests for Recurring Tasks functionality."""

    def test_create_recurring_task(self, authenticated_client):
        """Test creating a task with recurrence pattern."""
        url = reverse('tasks:task-list')
        data = {
            'title': 'Daily Standup',
            'recurrence_pattern': 'daily',
            'due_date': timezone.now().isoformat()
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['recurrence_pattern'] == 'daily'
        assert response.data['is_recurring'] is True

    def test_complete_recurring_creates_next_keep_history(self, authenticated_client):
        """Test completing recurring task with keep_history=True creates new task."""
        due_date = timezone.now()
        task = Task.objects.create(
            user=authenticated_client.user,
            title='Weekly Report',
            recurrence_pattern='weekly',
            due_date=due_date,
            keep_history=True
        )
        
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = authenticated_client.patch(url, {'status': 'completed'}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Original task completed
        task.refresh_from_db()
        assert task.status == Task.Status.COMPLETED
        
        # Verify new task created
        next_tasks = Task.objects.filter(title='Weekly Report', status='todo')
        assert next_tasks.count() == 1
        next_task = next_tasks.first()
        
        # New due date is roughly +7 days (ignoring exact second precision)
        expected_date = due_date + timedelta(weeks=1)
        assert next_task.due_date.date() == expected_date.date()

    def test_complete_recurring_updates_existing_no_history(self, authenticated_client):
        """Test completing recurring task with keep_history=False updates existing task."""
        due_date = timezone.now()
        task = Task.objects.create(
            user=authenticated_client.user,
            title='Daily Clean',
            recurrence_pattern='daily',
            due_date=due_date,
            keep_history=False
        )
        
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        response = authenticated_client.patch(url, {'status': 'completed'}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Same task updated to todo
        task.refresh_from_db()
        assert task.status == Task.Status.TODO
        
        # Due date updated
        expected_date = due_date + timedelta(days=1)
        assert task.due_date.date() == expected_date.date()

    def test_times_per_period_limit(self, authenticated_client):
        """Test that task doesn't re-occur if times_per_period reached."""
        task = Task.objects.create(
            user=authenticated_client.user,
            title='Thrice Weekly',
            recurrence_pattern='weekly',
            times_per_period=2,
            due_date=timezone.now(),
            keep_history=False
        )
        
        url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        
        # Complete once - should reset
        authenticated_client.patch(url, {'status': 'completed'}, format='json')
        task.refresh_from_db()
        assert task.status == Task.Status.TODO
        assert task.current_period_count == 1
        
        # Complete second time - should stay completed (limit reached)
        authenticated_client.patch(url, {'status': 'completed'}, format='json')
        task.refresh_from_db()
        assert task.status == Task.Status.COMPLETED
        assert task.current_period_count == 2
