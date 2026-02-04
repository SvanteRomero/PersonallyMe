import * as yup from 'yup';
import { PASSWORD_MIN_LENGTH, TITLE_MAX_LENGTH } from './constants';

// Login validation schema
export const loginSchema = yup.object({
    email: yup
        .string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: yup
        .string()
        .required('Password is required'),
});

// Registration validation schema
export const registerSchema = yup.object({
    email: yup
        .string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    first_name: yup
        .string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters'),
    last_name: yup
        .string()
        .optional(),
    password: yup
        .string()
        .required('Password is required')
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    password_confirm: yup
        .string()
        .required('Please confirm your password')
        .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Password reset request schema
export const passwordResetRequestSchema = yup.object({
    email: yup
        .string()
        .email('Please enter a valid email address')
        .required('Email is required'),
});

// Password reset confirm schema
export const passwordResetConfirmSchema = yup.object({
    password: yup
        .string()
        .required('Password is required')
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    password_confirm: yup
        .string()
        .required('Please confirm your password')
        .oneOf([yup.ref('password')], 'Passwords must match'),
});

// Change password schema
export const changePasswordSchema = yup.object({
    old_password: yup
        .string()
        .required('Current password is required'),
    new_password: yup
        .string()
        .required('New password is required')
        .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
});

// Task validation schema
export const taskSchema = yup.object({
    title: yup
        .string()
        .required('Title is required')
        .max(TITLE_MAX_LENGTH, `Title must be at most ${TITLE_MAX_LENGTH} characters`)
        .trim(),
    description: yup
        .string()
        .optional()
        .default(''),
    status: yup
        .string()
        .oneOf(['todo', 'in_progress', 'completed'] as const, 'Invalid status')
        .required('Status is required')
        .default('todo'),
    priority: yup
        .string()
        .oneOf(['low', 'medium', 'high'] as const, 'Invalid priority')
        .required('Priority is required')
        .default('medium'),
    due_date: yup
        .string()
        .optional()
        .default(''),

    // Recurrence fields
    recurrence_pattern: yup
        .string()
        .oneOf(['none', 'daily', 'weekly', 'monthly'] as const, 'Invalid recurrence pattern')
        .default('none'),
    times_per_period: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .optional()
        .min(1, 'Must be at least 1'),
    keep_history: yup
        .boolean()
        .default(true),
});

// Profile update schema
export const profileSchema = yup.object({
    first_name: yup
        .string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters'),
    last_name: yup
        .string()
        .optional(),
});

// Type exports for form data
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type TaskFormData = yup.InferType<typeof taskSchema>;
export type ProfileFormData = yup.InferType<typeof profileSchema>;
export type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;
