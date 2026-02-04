import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { taskService } from '../services/taskService';
import { TaskStats } from '../types';
import { ROUTES, THEMES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { error: showError } = useNotification();
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await taskService.getStats();
                setStats(data);
            } catch {
                showError('Failed to load task statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [showError]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Tasks',
            value: stats?.total || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: currentTheme.primaryColor,
        },
        {
            label: 'To Do',
            value: stats?.by_status.todo || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: '#6B7280',
        },
        {
            label: 'In Progress',
            value: stats?.by_status.in_progress || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: '#3B82F6',
        },
        {
            label: 'Completed',
            value: stats?.by_status.completed || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: '#10B981',
        },
        {
            label: 'Overdue',
            value: stats?.overdue || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: '#EF4444',
        },
        {
            label: 'Archived',
            value: stats?.deleted || 0,
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            color: '#8B5CF6',
        },
    ];

    const priorityCards = [
        { label: 'High Priority', value: stats?.by_priority.high || 0, color: '#EF4444' },
        { label: 'Medium Priority', value: stats?.by_priority.medium || 0, color: '#F59E0B' },
        { label: 'Low Priority', value: stats?.by_priority.low || 0, color: '#10B981' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            {/* Welcome */}
            <div className="bg-surface rounded-xl p-6 border border-themed">
                <h1 className="text-2xl font-bold text-body mb-1">
                    Welcome back, {user?.first_name || 'there'}! 👋
                </h1>
                <p className="text-secondary">
                    Here's an overview of your tasks. Stay productive!
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map(card => (
                    <div
                        key={card.label}
                        className="bg-surface rounded-xl p-4 border border-themed hover:shadow-lg transition-shadow"
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3"
                            style={{ backgroundColor: card.color }}
                        >
                            {card.icon}
                        </div>
                        <p className="text-2xl font-bold text-body">{card.value}</p>
                        <p className="text-sm text-muted">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Priority Breakdown */}
            <div className="bg-surface rounded-xl p-6 border border-themed">
                <h2 className="text-lg font-semibold text-body mb-4">Priority Breakdown</h2>
                <div className="grid grid-cols-3 gap-4">
                    {priorityCards.map(card => (
                        <div key={card.label} className="text-center">
                            <div
                                className="text-3xl font-bold mb-1"
                                style={{ color: card.color }}
                            >
                                {card.value}
                            </div>
                            <p className="text-sm text-muted">{card.label}</p>
                        </div>
                    ))}
                </div>
                {stats && stats.total > 0 && (
                    <div className="mt-4 h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex">
                        {stats.by_priority.high > 0 && (
                            <div
                                className="h-full"
                                style={{
                                    width: `${(stats.by_priority.high / stats.total) * 100}%`,
                                    backgroundColor: '#EF4444',
                                }}
                            />
                        )}
                        {stats.by_priority.medium > 0 && (
                            <div
                                className="h-full"
                                style={{
                                    width: `${(stats.by_priority.medium / stats.total) * 100}%`,
                                    backgroundColor: '#F59E0B',
                                }}
                            />
                        )}
                        {stats.by_priority.low > 0 && (
                            <div
                                className="h-full"
                                style={{
                                    width: `${(stats.by_priority.low / stats.total) * 100}%`,
                                    backgroundColor: '#10B981',
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to={ROUTES.TASKS}
                    className="bg-surface rounded-xl p-6 border border-themed hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                            style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-body group-hover:text-primary-color transition-colors">
                                View All Tasks
                            </h3>
                            <p className="text-sm text-muted">Manage and organize your tasks</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to={ROUTES.ARCHIVED}
                    className="bg-surface rounded-xl p-6 border border-themed hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-purple-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-body group-hover:text-primary-color transition-colors">
                                View Archived
                            </h3>
                            <p className="text-sm text-muted">Restore deleted tasks</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
