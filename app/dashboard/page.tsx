'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Plus, Hash, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

export default function DashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Read public cookies
    const getCookie = (name: string) =>
      document.cookie
        .split('; ')
        .find((r) => r.startsWith(`${name}=`))
        ?.split('=')[1] ?? '';

    setDisplayName(decodeURIComponent(getCookie('dv_display_name')));
    setAvatarUrl(decodeURIComponent(getCookie('dv_avatar')));
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/room/${data.room.id}`);
    } catch (e) {
      setError((e as Error).message ?? 'Error al crear la sala');
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Ingresá el código de invitación');
      return;
    }
    setIsJoining(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/room/${data.room.id}`);
    } catch (e) {
      setError((e as Error).message ?? 'Error al unirse a la sala');
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-rose-600/6 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center">
            <Music2 size={18} className="text-white" />
          </div>
          <span className="font-righteous text-2xl text-white">DuoVibe</span>
        </div>

        {/* User greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Avatar src={avatarUrl || null} alt={displayName} size="md" />
          <div>
            <p className="text-xs text-zinc-500">Bienvenido/a de vuelta</p>
            <p className="font-semibold text-zinc-100">{displayName || '…'}</p>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {/* Create room */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card glow className="cursor-pointer group" onClick={handleCreate}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/20 flex items-center justify-center">
                    <Plus size={20} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100">Crear sala</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Generá un código y compartilo
                    </p>
                  </div>
                </div>
                {isCreating ? (
                  <Loader2 size={18} className="text-zinc-500 animate-spin" />
                ) : (
                  <ArrowRight
                    size={18}
                    className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all"
                  />
                )}
              </div>
            </Card>
          </motion.div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">o</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Join room */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Hash size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Unirse a sala</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Ingresá el código de 8 caracteres
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-100 font-mono text-base tracking-widest placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                  aria-label="Código de invitación"
                />
                <Button
                  onClick={handleJoin}
                  isLoading={isJoining}
                  disabled={!inviteCode.trim()}
                  size="md"
                >
                  Entrar
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
