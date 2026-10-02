import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  barClassName?: string;
  showPercent?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className,
  barClassName,
  showPercent = false,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showPercent && (
        <div className="flex justify-between items-center mb-1 text-xs font-mono text-gray-400">
          <span>Progress</span>
          <span className="text-brand-400 font-semibold">{clamped}%</span>
        </div>
      )}
      <div
        className={twMerge(
          clsx(
            'w-full h-3 bg-surface-subtle/80 rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner',
            className
          )
        )}
      >
        <div
          className={twMerge(
            clsx(
              'h-full rounded-full bg-gradient-to-r from-brand-500 via-emerald-400 to-accent-cyan transition-all duration-300 ease-out relative overflow-hidden',
              barClassName
            )
          )}
          style={{ width: `${clamped}%` }}
        >
          {/* Subtle light shimmer sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
