// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Authentication
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';

// Theme
export const THEME_KEY = 'theme';
export const THEME_MODE_KEY = 'theme_mode';
export const DEFAULT_THEME = 'amber';
export const DEFAULT_THEME_MODE = 'light';

// Task Status
export const TASK_STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', color: 'gray' },
    { value: 'in_progress', label: 'In Progress', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
] as const;

// Task Priority
export const TASK_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'red' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// Notification
export const DEFAULT_NOTIFICATION_DURATION = 5000;

// Validation
export const PASSWORD_MIN_LENGTH = 8;
export const TITLE_MAX_LENGTH = 200;

// Date formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';

// Theme configurations
export const THEMES = {
    amber: {
        name: 'amber' as const,
        displayName: 'Amber Sunrise',
        description: 'Warm and inviting amber tones',
        primaryColor: '#F59E0B',
        primaryColorDark: '#D97706',
    },
    terracotta: {
        name: 'terracotta' as const,
        displayName: 'Terracotta Coral',
        description: 'Soft and earthy coral vibes',
        primaryColor: '#E07A5F',
        primaryColorDark: '#DC2626',
    },
    gold: {
        name: 'gold' as const,
        displayName: 'Classic Gold',
        description: 'Elegant and timeless warmth',
        primaryColor: '#B8860B',
        primaryColorDark: '#A16207',
    },
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    DASHBOARD: '/dashboard',
    TASKS: '/tasks',
    ARCHIVED: '/archived',
    SETTINGS: '/settings',
} as const;
