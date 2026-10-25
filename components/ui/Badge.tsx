'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'paused' | 'neutral' | 'green';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variants = {
    live: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    paused: 'bg-zinc-700/40 text-zinc-400 border border-zinc-700/40',
    neutral: 'bg-zinc-800 text-zinc-300 border border-zinc-700/40',
    green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
