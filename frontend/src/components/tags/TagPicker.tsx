import { useState, useEffect, useRef } from 'react';
import { Tag } from '../../types';
import { tagService } from '../../services/tagService';
import TagBadge from './TagBadge';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../utils/constants';

interface TagPickerProps {
    selectedTagIds: number[];
    onChange: (tagIds: number[]) => void;
}

export default function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTagColor, setNewTagColor] = useState('#6B7280'); // Default gray

    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const currentTheme = THEMES[theme];

    // Common colors for tag creation
    const predefinedColors = [
        '#EF4444', // Red
        '#F97316', // Orange
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#06B6D4', // Cyan
        '#3B82F6', // Blue
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6B7280', // Gray
    ];

    useEffect(() => {
        loadTags();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setIsCreating(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadTags = async () => {
        try {
            const data = await tagService.getTags();
            setTags(data);
        } catch (error) {
            console.error('Failed to load tags', error);
        }
    };

    const handleCreateTag = async () => {
        if (!inputValue.trim()) return;

        try {
            setIsLoading(true);
            const newTag = await tagService.createTag({
                name: inputValue.trim(),
                color: newTagColor
            });
            setTags(prev => [...prev, newTag]);
            onChange([...selectedTagIds, newTag.id]);
            setInputValue('');
            setIsCreating(false);
            setNewTagColor('#6B7280');
        } catch (error) {
            console.error('Failed to create tag', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTag = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTagIds.filter(id => id !== tagId));
        } else {
            onChange([...selectedTagIds, tagId]);
        }
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

    // Determine if we should show "Create new tag" option
    const showCreateOption = inputValue.trim().length > 0 &&
        !tags.some(t => t.name.toLowerCase() === inputValue.trim().toLowerCase());

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-body mb-1">
                Tags
            </label>

            <div className="space-y-2">
                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map(tag => (
                            <TagBadge
                                key={tag.id}
                                tag={tag}
                                onRemove={() => toggleTag(tag.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Input Field */}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowDropdown(true);
                        setIsCreating(false);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Add tags..."
                    className="w-full px-4 py-2.5 rounded-lg bg-surface border border-themed text-body placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-surface rounded-lg shadow-xl border border-themed max-h-[300px] overflow-y-auto">
                        {isCreating ? (
                            <div className="p-3 space-y-3">
                                <p className="text-sm font-medium text-body">Create tag "{inputValue}"</p>

                                <div>
                                    <label className="text-xs text-muted block mb-1.5">Select Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {predefinedColors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewTagColor(color)}
                                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newTagColor === color ? 'ring-2 ring-offset-1 ring-amber-500 scale-110' : ''}`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        style={{ backgroundColor: currentTheme.primaryColor }}
                                        onClick={handleCreateTag}
                                        isLoading={isLoading}
                                        className="flex-1"
                                    >
                                        Create
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1"
                                    >
                                        Back
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-1">
                                {filteredTags.length > 0 ? (
                                    filteredTags.map(tag => {
                                        const isSelected = selectedTagIds.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => {
                                                    toggleTag(tag.id);
                                                    setInputValue('');
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-surface-hover flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span className="text-sm text-body">{tag.name}</span>
                                                </div>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : (
                                    !showCreateOption && (
                                        <div className="px-3 py-4 text-center text-sm text-muted">
                                            No matching tags found
                                        </div>
                                    )
                                )}

                                {showCreateOption && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(true)}
                                        className="w-full text-left px-3 py-2 hover:bg-surface-hover text-sm text-primary-color font-medium border-t border-themed mt-1"
                                    >
                                        + Create "{inputValue}"
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
