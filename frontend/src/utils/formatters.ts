import { TaskPriority, TaskStatus } from '../types';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './constants';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a date string to include time
 */
export function formatDateTime(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a date for input fields (YYYY-MM-DDTHH:mm)
 */
export function formatDateForInput(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 0) {
        // Past
        if (diffDays < -30) return formatDate(dateString);
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
        if (diffDays === -1) return 'Yesterday';
        if (diffHours < -1) return `${Math.abs(diffHours)} hours ago`;
        if (diffMinutes < -1) return `${Math.abs(diffMinutes)} minutes ago`;
        return 'Just now';
    } else {
        // Future
        if (diffDays > 30) return formatDate(dateString);
        if (diffDays > 1) return `in ${diffDays} days`;
        if (diffDays === 1) return 'Tomorrow';
        if (diffHours > 1) return `in ${diffHours} hours`;
        if (diffMinutes > 1) return `in ${diffMinutes} minutes`;
        return 'Now';
    }
}

/**
 * Get status display info
 */
export function getStatusInfo(status: TaskStatus) {
    return TASK_STATUS_OPTIONS.find(s => s.value === status) || TASK_STATUS_OPTIONS[0];
}

/**
 * Get priority display info
 */
export function getPriorityInfo(priority: TaskPriority) {
    return TASK_PRIORITY_OPTIONS.find(p => p.value === priority) || TASK_PRIORITY_OPTIONS[1];
}

/**
 * Get priority badge classes
 */
export function getPriorityClasses(priority: TaskPriority): string {
    const classes = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return classes[priority] || classes.medium;
}

/**
 * Get status badge classes
 */
export function getStatusClasses(status: TaskStatus): string {
    const classes = {
        todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return classes[status] || classes.todo;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dateString: string | null): boolean {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
}

/**
 * Parse API errors into a readable message
 */
export function parseApiError(error: unknown): string {
    if (typeof error === 'string') return error;

    if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;

        if (err.detail && typeof err.detail === 'string') return err.detail;
        if (err.message && typeof err.message === 'string') return err.message;

        // Handle field errors
        const fieldErrors = Object.entries(err)
            .filter(([key]) => key !== 'detail' && key !== 'message')
            .map(([key, value]) => {
                const message = Array.isArray(value) ? value[0] : value;
                return `${capitalize(key.replace(/_/g, ' '))}: ${message}`;
            });

        if (fieldErrors.length > 0) return fieldErrors.join('. ');
    }

    return 'An unexpected error occurred. Please try again.';
}
