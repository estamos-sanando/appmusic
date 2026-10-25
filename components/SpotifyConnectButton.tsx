'use client';

import { Button } from '@/components/ui/Button';
import { Music } from 'lucide-react';

interface SpotifyConnectButtonProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function SpotifyConnectButton({
  size = 'lg',
  label = 'Conectar con Spotify',
}: SpotifyConnectButtonProps) {
  return (
    <a href="/api/auth/spotify/login" className="inline-block">
      <Button size={size} variant="primary" className="gap-2.5">
        <Music size={18} />
        {label}
      </Button>
    </a>
  );
}
