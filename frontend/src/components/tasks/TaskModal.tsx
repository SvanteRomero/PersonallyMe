import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Task, RecurrencePattern, TaskCreateData } from '../../types';
import { taskSchema, TaskFormData } from '../../utils/validation';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, THEMES } from '../../utils/constants';
import { formatDateForInput } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import Input from '../common/Input';
import TagPicker from '../tags/TagPicker';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskCreateData) => Promise<void>;
    task?: Task;
    title: string;
}

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

export default function TaskModal({ isOpen, onClose, onSubmit, task, title }: TaskModalProps) {
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<TaskFormData>({
        resolver: yupResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
            recurrence_pattern: 'none',
            times_per_period: undefined,
            keep_history: true,
        },
    });

    const recurrencePattern = useWatch({ control, name: 'recurrence_pattern' });

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                due_date: formatDateForInput(task.due_date),
                recurrence_pattern: task.recurrence_pattern || 'none',
                times_per_period: task.times_per_period || undefined,
                keep_history: task.keep_history ?? true,
            });
            // Initialize tags from task
            setSelectedTagIds(task.tags ? task.tags.map(t => t.id) : []);
        } else {
            reset({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                due_date: '',
                recurrence_pattern: 'none',
                times_per_period: undefined,
                keep_history: true,
            });
            setSelectedTagIds([]);
        }
    }, [task, reset]);

    const handleFormSubmit = async (data: TaskFormData) => {
        await onSubmit({
            title: data.title,
            description: data.description || undefined,
            status: data.status as Task['status'],
            priority: data.priority as Task['priority'],
            due_date: data.due_date || undefined,
            tag_ids: selectedTagIds,
            recurrence_pattern: data.recurrence_pattern as RecurrencePattern,
            times_per_period: data.recurrence_pattern !== 'none' ? (data.times_per_period ?? undefined) : undefined,
            keep_history: data.keep_history,
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
            <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-themed sticky top-0 bg-surface z-10">
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

                    {/* Tags */}
                    <div>
                        <TagPicker
                            selectedTagIds={selectedTagIds}
                            onChange={setSelectedTagIds}
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

                    {/* Recurrence Section */}
                    <div className="border-t border-themed pt-4">
                        <label className="block text-sm font-medium text-body mb-2">
                            Recurrence
                        </label>
                        <div className="space-y-3">
                            <select
                                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body focus:outline-none focus:ring-2 focus:ring-amber-500"
                                {...register('recurrence_pattern')}
                            >
                                {RECURRENCE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {recurrencePattern && recurrencePattern !== 'none' && (
                                <div className="space-y-3 pl-4 border-l-2 border-themed animate-enter">
                                    <Input
                                        type="number"
                                        label="Times per period (optional)"
                                        placeholder="e.g. 3 times per week"
                                        min={1}
                                        error={errors.times_per_period?.message}
                                        {...register('times_per_period')}
                                    />

                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            id="keep_history"
                                            className="mt-1 w-4 h-4 text-primary bg-surface border-themed rounded focus:ring-primary"
                                            {...register('keep_history')}
                                        />
                                        <label htmlFor="keep_history" className="text-sm text-body">
                                            <span className="font-medium">Keep history of completed tasks</span>
                                            <p className="text-xs text-muted mt-0.5">
                                                If checked, completion creates a new task copy.
                                                If unchecked, the same task is reset to "Todo" with a new due date.
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-themed mt-4">
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
