import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Task } from '../../types';
import { taskSchema, TaskFormData } from '../../utils/validation';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, THEMES } from '../../utils/constants';
import { formatDateForInput } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import Input from '../common/Input';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Task>) => Promise<void>;
    task?: Task;
    title: string;
}

export default function TaskModal({ isOpen, onClose, onSubmit, task, title }: TaskModalProps) {
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TaskFormData>({
        resolver: yupResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
        },
    });

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: formatDateForInput(task.due_date),
            });
        } else {
            reset({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                due_date: '',
            });
        }
    }, [task, reset]);

    const handleFormSubmit = async (data: TaskFormData) => {
        await onSubmit({
            title: data.title,
            description: data.description || null,
            status: data.status as Task['status'],
            priority: data.priority as Task['priority'],
            due_date: data.due_date || null,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-themed">
                    <h2 className="text-lg font-semibold text-body">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-body transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
                    <Input
                        label="Title"
                        placeholder="What needs to be done?"
                        error={errors.title?.message}
                        autoFocus
                        {...register('title')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-body mb-1">
                            Description
                        </label>
                        <textarea
                            placeholder="Add more details..."
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            {...register('description')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-body mb-1">
                                Status
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                                {...register('status')}
                            >
                                {TASK_STATUS_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-body mb-1">
                                Priority
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                                {...register('priority')}
                            >
                                {TASK_PRIORITY_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-body mb-1">
                            Due Date
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                            {...register('due_date')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="flex-1"
                            style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                            {task ? 'Save Changes' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
