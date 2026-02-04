import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ROUTES, THEMES } from '../../utils/constants';

export default function AuthLayout() {
    const { theme, mode, toggleMode } = useTheme();
    const currentTheme = THEMES[theme];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12"
                style={{
                    background: `linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-dark)) 100%)`,
                }}
            >
                <div className="text-white text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Personal Task Manager</h1>
                    <p className="text-xl text-white/80 mb-8">
                        Organize your life with a warm and inviting task management experience.
                    </p>
                    <div className="flex justify-center gap-4">
                        <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">Simple</div>
                            <div className="text-sm text-white/70">Easy to use</div>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">Secure</div>
                            <div className="text-sm text-white/70">Your data safe</div>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <div className="text-2xl font-bold">Fast</div>
                            <div className="text-sm text-white/70">Lightning quick</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4">
                    <Link to={ROUTES.LOGIN} className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="font-bold text-body lg:hidden">Task Manager</span>
                    </Link>
                    <button
                        onClick={toggleMode}
                        className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-body"
                        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {mode === 'light' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Form content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <Outlet />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 text-center text-sm text-muted">
                    © {new Date().getFullYear()} Personal Task Manager. All rights reserved.
                </div>
            </div>
        </div>
    );
}
