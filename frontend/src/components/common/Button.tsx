import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variantStyles = {
        primary: `
      bg-primary text-white
      hover:opacity-90
      focus:ring-amber-500 dark:focus:ring-amber-400
    `,
        secondary: `
      bg-surface text-body border border-themed
      hover:bg-surface-hover
      focus:ring-amber-500
    `,
        outline: `
      bg-transparent text-primary-color border-2
      hover:bg-primary hover:text-white
      focus:ring-amber-500
    `,
        ghost: `
      bg-transparent text-body
      hover:bg-surface-hover
      focus:ring-gray-400
    `,
        danger: `
      bg-red-500 text-white
      hover:bg-red-600
      focus:ring-red-500
    `,
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || isLoading}
            {...props}
            style={{
                backgroundColor: variant === 'primary' ? 'rgb(var(--color-primary))' : undefined,
                borderColor: variant === 'outline' ? 'rgb(var(--color-primary))' : undefined,
                color: variant === 'outline' ? 'rgb(var(--color-primary))' : undefined,
            }}
        >
            {isLoading ? (
                <>
                    <svg
                        className="animate-spin -ml-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
}
