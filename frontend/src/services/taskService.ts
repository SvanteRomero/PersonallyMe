import api from './api';
import {
    Task,
    TaskCreateData,
    TaskUpdateData,
    TaskStats,
    TaskFilters,
    PaginatedResponse
} from '../types';

export const taskService = {
    /**
     * Get paginated list of tasks
     */
    async getTasks(
        page: number = 1,
        filters?: TaskFilters
    ): Promise<PaginatedResponse<Task>> {
        const params = new URLSearchParams();
        params.append('page', page.toString());

        if (filters) {
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.due_date_after) params.append('due_date_after', filters.due_date_after);
            if (filters.due_date_before) params.append('due_date_before', filters.due_date_before);
            if (filters.is_overdue !== undefined) params.append('is_overdue', filters.is_overdue.toString());
            if (filters.search) params.append('search', filters.search);
            if (filters.tag_ids && filters.tag_ids.length > 0) {
                filters.tag_ids.forEach(id => params.append('tags', id.toString()));
            }
        }

        const response = await api.get<PaginatedResponse<Task>>(`/tasks/?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single task by ID
     */
    async getTask(id: number): Promise<Task> {
        const response = await api.get<Task>(`/tasks/${id}/`);
        return response.data;
    },

    /**
     * Create a new task
     */
    async createTask(data: TaskCreateData): Promise<Task> {
        const response = await api.post<Task>('/tasks/', data);
        return response.data;
    },

    /**
     * Update an existing task
     */
    async updateTask(id: number, data: TaskUpdateData): Promise<Task> {
        const response = await api.patch<Task>(`/tasks/${id}/`, data);
        return response.data;
    },

    /**
     * Soft delete a task
     */
    async deleteTask(id: number): Promise<void> {
        await api.delete(`/tasks/${id}/`);
    },

    /**
     * Get deleted tasks
     */
    async getDeletedTasks(page: number = 1): Promise<PaginatedResponse<Task>> {
        const response = await api.get<PaginatedResponse<Task>>(`/tasks/deleted/?page=${page}`);
        return response.data;
    },

    /**
     * Restore a deleted task
     */
    async restoreTask(id: number): Promise<Task> {
        const response = await api.post<{ message: string; task: Task }>(`/tasks/${id}/restore/`);
        return response.data.task;
    },

    /**
     * Get task statistics
     */
    async getStats(): Promise<TaskStats> {
        const response = await api.get<TaskStats>('/tasks/stats/');
        return response.data;
    },

    /**
     * Perform bulk action on tasks
     */
    async bulkAction(
        taskIds: number[],
        action: 'delete' | 'restore' | 'complete' | 'set_priority' | 'set_status',
        value?: string
    ): Promise<{ message: string; updated_count: number }> {
        const response = await api.post('/tasks/bulk_action/', {
            task_ids: taskIds,
            action,
            value,
        });
        return response.data;
    },
};

export default taskService;
