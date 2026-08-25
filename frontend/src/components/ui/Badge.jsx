import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({
  children,
  variant = 'purple',
  size = 'md',
  className = '',
}) {
  const variants = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-transparent shadow-sm',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center rounded-full border tracking-wide uppercase',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
}
