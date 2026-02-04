import { Tag } from '../../types';

interface TagBadgeProps {
    tag: Tag;
    onRemove?: () => void;
    size?: 'sm' | 'md';
    className?: string;
}

export default function TagBadge({ tag, onRemove, size = 'md', className = '' }: TagBadgeProps) {
    const isSmall = size === 'sm';

    // Calculate a contrasting text color (white or black) based on background brightness
    // Simple heuristic: lighter colors need black text
    const getContrastText = (hexColor: string) => {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // Calculate relative luminance
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#1F2937' : '#FFFFFF'; // gray-800 or white
    };

    const textColor = getContrastText(tag.color);

    return (
        <span
            className={`
                inline-flex items-center rounded-full font-medium transition-transform hover:scale-105
                ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'}
                ${className}
            `}
            style={{
                backgroundColor: tag.color,
                color: textColor,
                boxShadow: `0 1px 2px 0 ${tag.color}40` // 25% opacity shadow
            }}
        >
            {tag.name}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={`
                        ml-1.5 inline-flex items-center justify-center rounded-full 
                        hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent
                        ${isSmall ? 'h-3 w-3' : 'h-4 w-4'}
                    `}
                    aria-label={`Remove tag ${tag.name}`}
                >
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    );
}
