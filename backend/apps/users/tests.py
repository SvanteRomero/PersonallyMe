"""
Tests for users app - core authentication functionality.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_data():
    return {
        'email': 'test@example.com',
        'password': 'SecurePass123!',
        'password_confirm': 'SecurePass123!',
        'first_name': 'Test',
        'last_name': 'User',
    }


@pytest.fixture
def create_user(db):
    def _create_user(email='existing@example.com', password='SecurePass123!', **kwargs):
        return User.objects.create_user(
            email=email,
            password=password,
            first_name=kwargs.get('first_name', 'Existing'),
            last_name=kwargs.get('last_name', 'User'),
        )
    return _create_user


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration endpoint."""

    def test_register_success(self, api_client, user_data):
        """Test successful user registration."""
        url = reverse('users:register')
        response = api_client.post(url, user_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['email'] == user_data['email'].lower()
        assert User.objects.filter(email=user_data['email']).exists()

    def test_register_password_mismatch(self, api_client, user_data):
        """Test registration fails when passwords don't match."""
        user_data['password_confirm'] = 'DifferentPass123!'
        url = reverse('users:register')
        response = api_client.post(url, user_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.data

    def test_register_duplicate_email(self, api_client, user_data, create_user):
        """Test registration fails with duplicate email."""
        create_user(email=user_data['email'])
        url = reverse('users:register')
        response = api_client.post(url, user_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_register_weak_password(self, api_client, user_data):
        """Test registration fails with weak password."""
        user_data['password'] = '123'
        user_data['password_confirm'] = '123'
        url = reverse('users:register')
        response = api_client.post(url, user_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:
    """Tests for user login endpoint."""

    def test_login_success(self, api_client, create_user):
        """Test successful login."""
        user = create_user()
        url = reverse('users:login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_wrong_password(self, api_client, create_user):
        """Test login fails with wrong password."""
        user = create_user()
        url = reverse('users:login')
        response = api_client.post(url, {
            'email': user.email,
            'password': 'WrongPassword123!',
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Test login fails for non-existent user."""
        url = reverse('users:login')
        response = api_client.post(url, {
            'email': 'nonexistent@example.com',
            'password': 'SecurePass123!',
        }, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserLogout:
    """Tests for user logout endpoint."""

    def test_logout_success(self, api_client, create_user):
        """Test successful logout."""
        user = create_user()
        
        # Login first
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Logout
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_url = reverse('users:logout')
        response = api_client.post(logout_url, {'refresh': refresh_token}, format='json')
        
        assert response.status_code == status.HTTP_200_OK

    def test_logout_unauthenticated(self, api_client):
        """Test logout fails when not authenticated."""
        url = reverse('users:logout')
        response = api_client.post(url, {'refresh': 'fake-token'}, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTokenRefresh:
    """Tests for token refresh endpoint."""

    def test_token_refresh_success(self, api_client, create_user):
        """Test successful token refresh."""
        user = create_user()
        
        # Login first
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        refresh_token = login_response.data['refresh']
        
        # Refresh
        refresh_url = reverse('users:token-refresh')
        response = api_client.post(refresh_url, {'refresh': refresh_token}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoint."""

    def test_get_profile_success(self, api_client, create_user):
        """Test getting user profile."""
        user = create_user()
        
        # Login
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Get profile
        profile_url = reverse('users:profile')
        response = api_client.get(profile_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_update_profile_success(self, api_client, create_user):
        """Test updating user profile."""
        user = create_user()
        
        # Login
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Update profile
        profile_url = reverse('users:profile')
        response = api_client.patch(profile_url, {
            'first_name': 'Updated',
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'


@pytest.mark.django_db
class TestChangePassword:
    """Tests for change password endpoint."""

    def test_change_password_success(self, api_client, create_user):
        """Test successful password change."""
        user = create_user()
        
        # Login
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Change password
        url = reverse('users:change-password')
        response = api_client.put(url, {
            'old_password': 'SecurePass123!',
            'new_password': 'NewSecurePass456!',
        }, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify new password works
        api_client.credentials()  # Clear auth
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'NewSecurePass456!',
        }, format='json')
        assert login_response.status_code == status.HTTP_200_OK

    def test_change_password_wrong_old_password(self, api_client, create_user):
        """Test password change fails with wrong old password."""
        user = create_user()
        
        # Login
        login_url = reverse('users:login')
        login_response = api_client.post(login_url, {
            'email': user.email,
            'password': 'SecurePass123!',
        }, format='json')
        
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Try to change password
        url = reverse('users:change-password')
        response = api_client.put(url, {
            'old_password': 'WrongOldPass123!',
            'new_password': 'NewSecurePass456!',
        }, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
