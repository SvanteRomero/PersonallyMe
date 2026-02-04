import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ROUTES } from './utils/constants';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ArchivedPage from './pages/ArchivedPage';
import SettingsPage from './pages/SettingsPage';

// Components
import ToastContainer from './components/common/ToastContainer';
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <>{children}</>;
}

// Public Route wrapper (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <>
            <Routes>
                {/* Public routes */}
                <Route element={<AuthLayout />}>
                    <Route
                        path={ROUTES.LOGIN}
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path={ROUTES.REGISTER}
                        element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path={ROUTES.FORGOT_PASSWORD}
                        element={
                            <PublicRoute>
                                <ForgotPasswordPage />
                            </PublicRoute>
                        }
                    />
                </Route>

                {/* Protected routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.TASKS} element={<TasksPage />} />
                    <Route path={ROUTES.ARCHIVED} element={<ArchivedPage />} />
                    <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                </Route>

                {/* Redirects */}
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>

            {/* Global toast notifications */}
            <ToastContainer />
        </>
    );
}

export default App;
