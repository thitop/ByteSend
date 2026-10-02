import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] select-none rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090a0f] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const sizeStyles = {
      sm: 'text-xs px-3.5 py-2 min-h-[38px]',
      md: 'text-sm px-5 py-2.5 min-h-[44px]',
      lg: 'text-base px-6 py-3.5 min-h-[50px] font-semibold',
    };

    const variantStyles = {
      primary:
        'bg-brand-500 hover:bg-brand-400 text-gray-950 font-semibold shadow-glow-sm hover:shadow-glow-sm hover:shadow-brand-500/30 focus:ring-brand-400 border border-brand-400/30',
      secondary:
        'bg-surface-subtle hover:bg-surface-subtle/80 text-gray-200 border border-surface-border hover:border-gray-600 focus:ring-gray-400',
      outline:
        'bg-transparent hover:bg-white/5 text-gray-300 border border-white/10 hover:border-white/20 focus:ring-gray-400',
      danger:
        'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 focus:ring-rose-500',
      ghost:
        'bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200 focus:ring-gray-400',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
