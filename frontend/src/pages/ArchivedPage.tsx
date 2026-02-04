import { useEffect, useState, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { useNotification } from '../contexts/NotificationContext';
import { Task } from '../types';
import { parseApiError, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

export default function ArchivedPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [restoringId, setRestoringId] = useState<number | null>(null);

    const { success, error: showError } = useNotification();

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await taskService.getDeletedTasks(page);
            setTasks(response.results);
            setTotalCount(response.count);
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsLoading(false);
        }
    }, [page, showError]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleRestore = async (taskId: number) => {
        setRestoringId(taskId);
        try {
            await taskService.restoreTask(taskId);
            success('Task restored successfully!');
            fetchTasks();
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setRestoringId(null);
        }
    };

    const totalPages = Math.ceil(totalCount / 10);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-body">Archived Tasks</h1>
                <p className="text-muted">
                    {totalCount} archived task{totalCount !== 1 ? 's' : ''}.
                    Restore them to bring them back to your task list.
                </p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-body mb-2">No archived tasks</h3>
                    <p className="text-muted">When you delete tasks, they'll appear here for recovery.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-surface rounded-xl p-4 border border-themed flex items-center justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-body truncate">{task.title}</h3>
                                {task.description && (
                                    <p className="text-sm text-muted truncate">{task.description}</p>
                                )}
                                <p className="text-xs text-muted mt-1">
                                    Deleted: {formatDate(task.deleted_at)}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(task.id)}
                                isLoading={restoringId === task.id}
                                leftIcon={
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                }
                            >
                                Restore
                            </Button>
                        </div>
                    ))}
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
        </div>
    );
}
