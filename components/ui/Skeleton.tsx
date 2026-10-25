'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-zinc-800/70',
        className
      )}
      aria-hidden="true"
    />
  );
}

export function NowPlayingSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <Skeleton className="w-full aspect-square rounded-xl max-w-[200px] mx-auto" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
