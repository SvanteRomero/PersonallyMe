import api from './api';
import {
    AuthResponse,
    LoginCredentials,
    LoginResponse,
    RegisterData,
    User
} from '../types';

export const authService = {
    /**
     * Register a new user
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register/', data);
        return response.data;
    },

    /**
     * Login user
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login/', credentials);
        return response.data;
    },

    /**
     * Logout user
     */
    async logout(refreshToken: string): Promise<void> {
        await api.post('/auth/logout/', { refresh: refreshToken });
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<{ access: string; refresh?: string }> {
        const response = await api.post('/auth/refresh/', { refresh: refreshToken });
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/me/');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.patch<User>('/auth/me/', data);
        return response.data;
    },

    /**
     * Change password
     */
    async changePassword(old_password: string, new_password: string): Promise<void> {
        await api.put('/auth/change-password/', { old_password, new_password });
    },

    /**
     * Request password reset (stubbed)
     */
    async requestPasswordReset(email: string): Promise<{ message: string }> {
        const response = await api.post('/auth/password-reset/', { email });
        return response.data;
    },

    /**
     * Confirm password reset (stubbed)
     */
    async confirmPasswordReset(
        token: string,
        password: string,
        password_confirm: string
    ): Promise<{ message: string }> {
        const response = await api.post('/auth/password-reset-confirm/', {
            token,
            password,
            password_confirm,
        });
        return response.data;
    },
};

export default authService;
