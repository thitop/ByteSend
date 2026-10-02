import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'cyan' | 'neutral' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'brand',
  ...props
}) => {
  const variantStyles = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    neutral: 'bg-white/5 text-gray-300 border-white/10',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border tracking-wide uppercase',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
