// User types
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name?: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    tokens: AuthTokens;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

// Tag types
export interface Tag {
    id: number;
    name: string;
    color: string;
    is_predefined: boolean;
}

export interface TagCreateData {
    name: string;
    color: string;
}

// Task types
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    tags: Tag[];
    is_overdue: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    user_email?: string;

    // Recurrence fields
    recurrence_pattern: RecurrencePattern;
    times_per_period?: number | null;
    current_period_count?: number;
    period_start_date?: string;
    is_recurring: boolean;
    keep_history?: boolean;
}

export interface TaskCreateData {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    tag_ids?: number[];

    // Recurrence fields
    recurrence_pattern?: RecurrencePattern;
    times_per_period?: number;
    keep_history?: boolean;
}

export interface TaskUpdateData extends Partial<TaskCreateData> { }

export interface TaskStats {
    total: number;
    by_status: {
        todo: number;
        in_progress: number;
        completed: number;
    };
    by_priority: {
        low: number;
        medium: number;
        high: number;
    };
    overdue: number;
    deleted: number;
}

export interface TaskFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date_after?: string;
    due_date_before?: string;
    is_overdue?: boolean;
    search?: string;
    tag_ids?: number[];
}

// API Response types
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ApiError {
    detail?: string;
    message?: string;
    [key: string]: string | string[] | undefined;
}

// Theme types
export type ThemeName = 'amber' | 'terracotta' | 'gold';
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
    name: ThemeName;
    mode: ThemeMode;
    displayName: string;
    primaryColor: string;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
    persistent?: boolean;
}

// Form types
export interface FieldError {
    message: string;
}
