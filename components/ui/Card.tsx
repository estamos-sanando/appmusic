'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  glass?: boolean;
}

export function Card({ className, glow, glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-5 transition-all duration-300',
        glass && 'backdrop-blur-md bg-zinc-900/60',
        glow && 'shadow-lg shadow-rose-950/20 hover:shadow-rose-900/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
