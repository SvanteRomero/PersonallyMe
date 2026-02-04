import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { registerSchema, RegisterFormData } from '../utils/validation';
import { parseApiError } from '../utils/formatters';
import { ROUTES } from '../utils/constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { register: registerUser } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: yupResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await registerUser(data);
            showSuccess('Account created successfully!');
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
                <h2 className="text-3xl font-bold text-body mb-2">Create Account</h2>
                <p className="text-secondary">Get started with your personal task manager</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        placeholder="John"
                        autoComplete="given-name"
                        error={errors.first_name?.message}
                        {...register('first_name')}
                    />
                    <Input
                        label="Last Name"
                        placeholder="Doe"
                        autoComplete="family-name"
                        error={errors.last_name?.message}
                        {...register('last_name')}
                    />
                </div>

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
                    autoComplete="new-password"
                    helperText="At least 8 characters with uppercase, lowercase, and number"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={errors.password_confirm?.message}
                    {...register('password_confirm')}
                />

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isLoading}
                >
                    Create Account
                </Button>
            </form>

            <p className="mt-8 text-center text-secondary">
                Already have an account?{' '}
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
