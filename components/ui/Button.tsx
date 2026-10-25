'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-95';

    const variants = {
      primary: 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
      ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
      danger: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/30',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-5 py-2.5 text-sm h-10',
      lg: 'px-7 py-3 text-base h-12',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
