import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { loginSchema, LoginFormData } from '../utils/validation';
import { parseApiError } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { error: showError } = useNotification();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: yupResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            await login(data);
            navigate(ROUTES.DASHBOARD);
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-body mb-2">Welcome Back</h2>
                <p className="text-secondary">Sign in to continue managing your tasks</p>
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

                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <div className="flex items-center justify-end">
                    <Link
                        to={ROUTES.FORGOT_PASSWORD}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'rgb(var(--color-primary))' }}
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                >
                    Sign In
                </Button>
            </form>

            <p className="mt-8 text-center text-secondary">
                Don't have an account?{' '}
                <Link
                    to={ROUTES.REGISTER}
                    className="font-semibold hover:underline"
                    style={{ color: 'rgb(var(--color-primary))' }}
                >
                    Create one
                </Link>
            </p>
        </div>
    );
}
