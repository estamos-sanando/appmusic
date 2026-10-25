'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  fallback?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

const pxMap = { xs: 24, sm: 32, md: 40, lg: 56 };

export function Avatar({ src, alt, size = 'md', className, fallback }: AvatarProps) {
  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden ring-2 ring-zinc-700/60 bg-zinc-800 flex items-center justify-center font-semibold text-zinc-400',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={pxMap[size]}
          height={pxMap[size]}
          className="object-cover w-full h-full"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
