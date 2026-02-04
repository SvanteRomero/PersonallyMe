import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tag, TagCreateData } from '../../types';
import { tagService } from '../../services/tagService';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';
import TagBadge from './TagBadge';

const tagSchema = yup.object({
    name: yup.string().required('Tag name is required').max(50, 'Tag name must be less than 50 characters'),
    color: yup.string().required('Color is required').matches(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
}).required();

export default function TagManager() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#6B7280');

    const { success, error: showError } = useNotification();
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<TagCreateData>({
        resolver: yupResolver(tagSchema),
        defaultValues: {
            name: '',
            color: '#6B7280',
        },
    });

    const predefinedColors = [
        '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
        '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
    ];

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        setIsLoading(true);
        try {
            const data = await tagService.getTags();
            setTags(data);
        } catch (err) {
            showError('Failed to load tags');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: TagCreateData) => {
        setIsSubmitting(true);
        try {
            const newTag = await tagService.createTag(data);
            setTags(prev => [...prev, newTag]);
            success('Tag created successfully');
            reset();
            setSelectedColor('#6B7280');
        } catch (err) {
            showError('Failed to create tag');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this tag?')) return;

        try {
            await tagService.deleteTag(id);
            setTags(prev => prev.filter(t => t.id !== id));
            success('Tag deleted successfully');
        } catch (err) {
            showError('Failed to delete tag');
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Create Tag Form */}
            <div className="bg-surface rounded-xl p-6 border border-themed">
                <h2 className="text-lg font-semibold text-body mb-4">Create New Tag</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <Input
                        label="Tag Name"
                        placeholder="e.g. Work, Study"
                        error={errors.name?.message}
                        {...register('name')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-body mb-2">Color</label>
                        <div className="flex flex-wrap gap-3 mb-2">
                            {predefinedColors.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setValue('color', color);
                                    }}
                                    className={`
                                        w-8 h-8 rounded-full transition-transform hover:scale-110
                                        ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}
                                    `}
                                    style={{
                                        backgroundColor: color,
                                        borderColor: currentTheme.primaryColor
                                    }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                        </div>
                        <input type="hidden" {...register('color')} />
                        {errors.color && (
                            <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                        )}
                    </div>

                    <Button type="submit" isLoading={isSubmitting}>
                        Create Tag
                    </Button>
                </form>
            </div>

            {/* Tags List */}
            <div>
                <h2 className="text-lg font-semibold text-body mb-4">My Tags</h2>
                {isLoading ? (
                    <div className="text-muted">Loading tags...</div>
                ) : (
                    <div className="bg-surface rounded-xl border border-themed overflow-hidden">
                        {tags.length === 0 ? (
                            <div className="p-8 text-center text-muted">
                                No tags found. Create one above!
                            </div>
                        ) : (
                            <div className="divide-y divide-themed">
                                {tags.map(tag => (
                                    <div key={tag.id} className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
                                        <div className="flex items-center gap-3">
                                            <TagBadge tag={tag} />
                                            {tag.is_predefined && (
                                                <span className="text-xs text-muted bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Default</span>
                                            )}
                                        </div>

                                        {!tag.is_predefined && (
                                            <button
                                                onClick={() => handleDelete(tag.id)}
                                                className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete tag"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
