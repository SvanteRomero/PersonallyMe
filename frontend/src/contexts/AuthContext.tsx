import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../utils/constants';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem(ACCESS_TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    // Verify token is still valid by fetching profile
                    const profile = await authService.getProfile();
                    setUser(profile);
                    localStorage.setItem(USER_KEY, JSON.stringify(profile));
                } catch {
                    // Token is invalid, clear storage
                    localStorage.removeItem(ACCESS_TOKEN_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);

        localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        setUser(response.user);
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const response = await authService.register(data);

        localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        setUser(response.user);
    }, []);

    const logout = useCallback(async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        try {
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch {
            // Ignore logout errors
        } finally {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
        }
    }, []);

    const updateUser = useCallback(async (data: Partial<User>) => {
        const updatedUser = await authService.updateProfile(data);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
