import { useEffect, useState, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, TaskFilters, TaskStatus, TaskPriority } from '../types';
import { THEMES, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../utils/constants';
import { parseApiError, getStatusClasses, getPriorityClasses, formatDate, getRelativeTime } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import TaskModal from '../components/tasks/TaskModal';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal';

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState<TaskFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTask, setDeletingTask] = useState<Task | null>(null);

    const { success, error: showError } = useNotification();
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await taskService.getTasks(page, {
                ...filters,
                search: searchTerm || undefined,
            });
            setTasks(response.results);
            setTotalCount(response.count);
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [page, filters, searchTerm, showError]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async (data: Partial<Task>) => {
        try {
            await taskService.createTask(data as any);
            success('Task created successfully!');
            setIsCreateModalOpen(false);
            fetchTasks();
        } catch (err) {
            showError(parseApiError(err));
        }
    };

    const handleUpdateTask = async (data: Partial<Task>) => {
        if (!editingTask) return;
        try {
            await taskService.updateTask(editingTask.id, data);
            success('Task updated successfully!');
            setEditingTask(null);
            fetchTasks();
        } catch (err) {
            showError(parseApiError(err));
        }
    };

    const handleDeleteTask = async () => {
        if (!deletingTask) return;
        try {
            await taskService.deleteTask(deletingTask.id);
            success('Task moved to archive');
            setDeletingTask(null);
            fetchTasks();
        } catch (err) {
            showError(parseApiError(err));
        }
    };

    const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
        try {
            await taskService.updateTask(task.id, { status: newStatus });
            success('Status updated');
            fetchTasks();
        } catch (err) {
            showError(parseApiError(err));
        }
    };

    const totalPages = Math.ceil(totalCount / 10);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-body">My Tasks</h1>
                    <p className="text-muted">{totalCount} task{totalCount !== 1 ? 's' : ''} total</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    leftIcon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    }
                >
                    New Task
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="bg-surface rounded-xl p-4 border border-themed space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-background border border-themed text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus || undefined })}
                        className="px-4 py-2 rounded-lg bg-background border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">All Status</option>
                        {TASK_STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={filters.priority || ''}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority || undefined })}
                        className="px-4 py-2 rounded-lg bg-background border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">All Priority</option>
                        {TASK_PRIORITY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    {/* View Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-themed">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-2 ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-surface text-body'}`}
                            style={{ backgroundColor: viewMode === 'card' ? currentTheme.primaryColor : undefined }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-2 ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-surface text-body'}`}
                            style={{ backgroundColor: viewMode === 'table' ? currentTheme.primaryColor : undefined }}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-surface rounded-xl p-12 border border-themed text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-body mb-2">No tasks found</h3>
                    <p className="text-muted mb-4">Get started by creating your first task!</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>Create Task</Button>
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-surface rounded-xl p-4 border border-themed hover:shadow-lg transition-all cursor-pointer group"
                            onClick={() => setEditingTask(task)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-body group-hover:text-primary-color transition-colors line-clamp-2">
                                    {task.title}
                                </h3>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeletingTask(task); }}
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {task.description && (
                                <p className="text-sm text-muted mb-3 line-clamp-2">{task.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>
                                    {TASK_STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClasses(task.priority)}`}>
                                    {TASK_PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                                </span>
                            </div>

                            {task.due_date && (
                                <p className={`text-xs ${task.is_overdue ? 'text-red-500 font-medium' : 'text-muted'}`}>
                                    {task.is_overdue ? '⚠️ Overdue: ' : 'Due: '}
                                    {getRelativeTime(task.due_date)}
                                </p>
                            )}

                            {/* Quick status change */}
                            <div className="mt-3 pt-3 border-t border-themed flex gap-2">
                                {TASK_STATUS_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task, option.value); }}
                                        className={`flex-1 py-1 text-xs rounded transition-colors ${task.status === option.value
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-muted hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        style={{ backgroundColor: task.status === option.value ? currentTheme.primaryColor : undefined }}
                                        disabled={task.status === option.value}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-surface rounded-xl border border-themed overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-body">Title</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-body hidden md:table-cell">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-body hidden md:table-cell">Priority</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-body hidden lg:table-cell">Due Date</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-body">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-themed">
                            {tasks.map(task => (
                                <tr key={task.id} className="hover:bg-surface-hover transition-colors">
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setEditingTask(task)}
                                            className="font-medium text-body hover:text-primary-color text-left"
                                        >
                                            {task.title}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(task.status)}`}>
                                            {TASK_STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClasses(task.priority)}`}>
                                            {TASK_PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {task.due_date ? (
                                            <span className={task.is_overdue ? 'text-red-500' : 'text-muted'}>
                                                {formatDate(task.due_date)}
                                            </span>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => setDeletingTask(task)}
                                            className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4 text-body">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Modals */}
            <TaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTask}
                title="Create New Task"
            />

            <TaskModal
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={handleUpdateTask}
                task={editingTask || undefined}
                title="Edit Task"
            />

            <DeleteConfirmModal
                isOpen={!!deletingTask}
                onClose={() => setDeletingTask(null)}
                onConfirm={handleDeleteTask}
                taskTitle={deletingTask?.title || ''}
            />
        </div>
    );
}
