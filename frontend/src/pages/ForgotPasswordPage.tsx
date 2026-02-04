import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNotification } from '../contexts/NotificationContext';
import { authService } from '../services/authService';
import { passwordResetRequestSchema } from '../utils/validation';
import { parseApiError } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

interface ForgotPasswordFormData {
    email: string;
}

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { error: showError, success: showSuccess } = useNotification();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: yupResolver(passwordResetRequestSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            await authService.requestPasswordReset(data.email);
            showSuccess('Password reset instructions sent to your email.');
            setIsSubmitted(true);
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="animate-fade-in text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-body mb-2">Check Your Email</h2>
                <p className="text-secondary mb-6">
                    If an account exists with that email, we've sent password reset instructions.
                </p>
                <Link
                    to={ROUTES.LOGIN}
                    className="font-semibold hover:underline"
                    style={{ color: 'rgb(var(--color-primary))' }}
                >
                    Back to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-body mb-2">Forgot Password?</h2>
                <p className="text-secondary">
                    Enter your email and we'll send you instructions to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                >
                    Send Reset Instructions
                </Button>
            </form>

            <p className="mt-8 text-center text-secondary">
                Remember your password?{' '}
                <Link
                    to={ROUTES.LOGIN}
                    className="font-semibold hover:underline"
                    style={{ color: 'rgb(var(--color-primary))' }}
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
