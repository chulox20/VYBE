import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Avatar({
  src,
  alt = 'Usuario',
  name = 'User',
  size = 'md',
  isOnline = false,
  className = '',
  onClick,
}) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-3xl font-extrabold',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 right-0 bottom-0',
    sm: 'w-2 h-2 right-0 bottom-0',
    md: 'w-2.5 h-2.5 right-0.5 bottom-0.5 ring-2 ring-white',
    lg: 'w-3.5 h-3.5 right-1 bottom-1 ring-2 ring-white',
    xl: 'w-4 h-4 right-1.5 bottom-1.5 ring-2 ring-white',
    '2xl': 'w-5 h-5 right-2 bottom-2 ring-4 ring-white',
  };

  const initials = (name || alt || 'U')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-medium shadow-sm',
          sizes[size],
          onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
          className
        )
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

      {isOnline && (
        <span
          className={clsx(
            'absolute rounded-full bg-emerald-500 shadow-sm',
            statusDotSizes[size]
          )}
        />
      )}
    </div>
  );
}
