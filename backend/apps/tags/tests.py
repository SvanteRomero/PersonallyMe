"""
Tests for tags app.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Tag

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


@pytest.mark.django_db
class TestTags:
    """Tests for Tag functionality."""

    def test_predefined_tags_created_on_fetch(self, authenticated_client):
        """Test that fetching tags creates predefined ones if missing."""
        url = reverse('tags:tag-list')
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
        url = reverse('tags:tag-list')
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
        
        url = reverse('tags:tag-detail', kwargs={'pk': tag.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_custom_tag(self, authenticated_client):
        """Test deleting custom tags works."""
        tag = Tag.objects.create(user=authenticated_client.user, name='Custom', color='#123456')
        url = reverse('tags:tag-detail', kwargs={'pk': tag.id})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT

    # Note: assign_tags_to_task test stays in tasks app because it tests Task creation (but requires Tag creation)
