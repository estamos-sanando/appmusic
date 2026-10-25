'use client';

import { cn } from '@/lib/utils';

interface PulseIndicatorProps {
  active?: boolean;
  className?: string;
}

export function PulseIndicator({ active = true, className }: PulseIndicatorProps) {
  return (
    <span
      className={cn('relative flex items-center justify-center w-3 h-3', className)}
      aria-hidden="true"
    >
      {active ? (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-rose-500" />
        </>
      ) : (
        <span className="relative inline-flex rounded-full w-2 h-2 bg-zinc-600" />
      )}
    </span>
  );
}
