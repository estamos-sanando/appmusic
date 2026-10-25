'use client';

import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TrackProgressBarProps {
  progressMs: number;
  durationMs: number;
  isPlaying?: boolean;
  className?: string;
}

export function TrackProgressBar({
  progressMs,
  durationMs,
  isPlaying = true,
  className,
}: TrackProgressBarProps) {
  const pct = durationMs > 0 ? Math.min((progressMs / durationMs) * 100, 100) : 0;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Progress bar */}
      <div
        className="relative w-full h-1.5 rounded-full bg-zinc-700/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressMs}
        aria-valuemin={0}
        aria-valuemax={durationMs}
        aria-label="Track progress"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            isPlaying
              ? 'bg-gradient-to-r from-rose-500 to-rose-400'
              : 'bg-zinc-600'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Time labels */}
      <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
        <span>{formatDuration(progressMs)}</span>
        <span>{formatDuration(durationMs)}</span>
      </div>
    </div>
  );
}
