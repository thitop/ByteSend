import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  innerClassName?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, innerClassName, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bezel-outer rounded-3xl p-1 md:p-1.5 transition-[border-color,box-shadow] duration-200',
          className
        )
      )}
      {...props}
    >
      <div
        className={twMerge(
          clsx(
            'bezel-inner rounded-[calc(1.5rem-0.25rem)] p-6 md:p-8 text-gray-100 h-full min-h-0',
            innerClassName
          )
        )}
      >
        {children}
      </div>
    </div>
  );
};
