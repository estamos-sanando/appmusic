'use client';

import { useState } from 'react';
import { Copy, Check, Users, Wifi, WifiOff } from 'lucide-react';
import { Room } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface RoomHeaderProps {
  room: Room;
  memberCount: number;
  isConnected: boolean;
  className?: string;
}

export function RoomHeader({ room, memberCount, isConnected, className }: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/60',
        className
      )}
    >
      {/* Left: Room info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Users size={15} />
          <span>
            <span className="text-zinc-200 font-medium">{memberCount}</span>
            <span className="text-zinc-600">/2 en la sala</span>
          </span>
        </div>
        {/* Connection status */}
        <div className="flex items-center gap-1.5 text-xs">
          {isConnected ? (
            <>
              <Wifi size={13} className="text-emerald-500" />
              <span className="text-emerald-500">Sincronizado</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-zinc-600" />
              <span className="text-zinc-600">Conectando…</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Invite code */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/40">
          <span className="text-xs text-zinc-500 hidden sm:inline">Código:</span>
          <code className="text-sm font-mono font-bold tracking-widest text-zinc-100">
            {room.invite_code}
          </code>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyCode}
          aria-label="Copiar código de invitación"
          className="w-8 h-8 p-0"
        >
          {copied ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <Copy size={14} />
          )}
        </Button>
      </div>
    </header>
  );
}
