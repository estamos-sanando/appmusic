'use client';

import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpotifyConnectButtonProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function SpotifyConnectButton({
  size = 'lg',
  label = 'Conectar con Spotify',
  className,
}: SpotifyConnectButtonProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-5 py-2.5 text-sm h-10',
    lg: 'px-7 py-3 text-base h-12',
  };

  return (
    <a
      href="/api/auth/spotify/login"
      className={cn(
        'inline-flex items-center justify-center gap-2.5 font-medium rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95',
        'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30',
        sizes[size],
        className
      )}
    >
      <Music size={18} />
      <span>{label}</span>
    </a>
  );
}

