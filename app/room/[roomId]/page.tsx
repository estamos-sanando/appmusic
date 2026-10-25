'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { NowPlaying, Room, RoomMember } from '@/types';
import { NowPlayingCard } from '@/components/NowPlayingCard';
import { ListeningHistoryFeed } from '@/components/ListeningHistoryFeed';
import { RoomHeader } from '@/components/RoomHeader';
import { Card } from '@/components/ui/Card';
import { useSpotifySync } from '@/hooks/useSpotifySync';
import { useRoomRealtime } from '@/hooks/useRoomRealtime';
import { useListeningHistory } from '@/hooks/useListeningHistory';
import { Music2 } from 'lucide-react';

interface RoomData {
  room: Room;
  members: RoomMember[];
  myUserId: string;
  myName: string;
  myAvatar: string;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [myNowPlaying, setMyNowPlaying] = useState<NowPlaying | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read session cookies
  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((r) => r.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=') ?? ''
    );
  };

  const myUserId = getCookie('dv_spotify_id');
  const myName = decodeURIComponent(getCookie('dv_display_name')) || 'Tú';
  const myAvatar = decodeURIComponent(getCookie('dv_avatar'));

  // Load room data
  useEffect(() => {
    if (!roomId || !myUserId) {
      router.replace('/dashboard');
      return;
    }

    const fetchRoom = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (!room) {
        router.replace('/dashboard');
        return;
      }

      const { data: members } = await supabase
        .from('room_members')
        .select('*, profile:profiles(id, display_name, avatar_url, spotify_id)')
        .eq('room_id', roomId);

      setRoomData({
        room,
        members: members ?? [],
        myUserId,
        myName,
        myAvatar,
      });
      setIsLoading(false);
    };

    fetchRoom();
  }, [roomId, myUserId, router, supabase, myName, myAvatar]);

  // Load my current now_playing
  useEffect(() => {
    if (!myUserId) return;
    const fetchMy = async () => {
      const { data } = await supabase
        .from('now_playing')
        .select('*')
        .eq('user_id', myUserId)
        .maybeSingle();
      if (data) setMyNowPlaying(data);
    };
    fetchMy();
  }, [myUserId, supabase]);

  const handleMyTrackChange = useCallback(
    (track: import('@/types').SpotifyTrack | null) => {
      if (!track) return;
      setMyNowPlaying((prev) => ({
        ...(prev ?? {}),
        user_id: myUserId,
        track_id: track.track_id,
        track_name: track.track_name,
        artist_name: track.artist_name,
        album_name: track.album_name,
        album_art_url: track.album_art_url,
        track_url: track.track_url,
        progress_ms: track.progress_ms,
        duration_ms: track.duration_ms,
        is_playing: track.is_playing,
        updated_at: new Date().toISOString(),
      }));
    },
    [myUserId]
  );

  // Partner user ID
  const partnerMember = roomData?.members.find(
    (m) => m.profile?.spotify_id !== myUserId
  );
  const partnerUserId = partnerMember?.profile?.spotify_id ?? null;
  const partnerName = partnerMember?.profile?.display_name ?? 'Tu dupla';
  const partnerAvatar = partnerMember?.profile?.avatar_url ?? null;

  // Hooks
  useSpotifySync({
    userId: myUserId,
    enabled: !!myUserId && !isLoading,
    onTrackChange: handleMyTrackChange,
  });

  const { partnerNowPlaying, isConnected } = useRoomRealtime({
    roomId: roomId ?? '',
    partnerUserId,
  });

  const { history, isLoading: historyLoading } = useListeningHistory(roomId ?? '');

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Music2 size={36} strokeWidth={1} className="animate-pulse" />
          <p className="text-sm">Cargando sala…</p>
        </div>
      </div>
    );
  }

  if (!roomData) return null;

  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-6 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-rose-600/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center">
            <Music2 size={14} className="text-white" />
          </div>
          <span className="font-righteous text-lg text-white">DuoVibe</span>
        </div>

        {/* Room header */}
        <RoomHeader
          room={roomData.room}
          memberCount={roomData.members.length}
          isConnected={isConnected}
          className="mb-6"
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* My card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              glow
              glass
              className="border-rose-900/30 shadow-rose-950/20"
            >
              <NowPlayingCard
                nowPlaying={myNowPlaying}
                displayName={myName}
                avatarUrl={myAvatar}
                isMe={true}
              />
            </Card>
          </motion.div>

          {/* Partner card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card
              glass
              className="border-blue-900/20"
            >
              {partnerUserId ? (
                <NowPlayingCard
                  nowPlaying={partnerNowPlaying}
                  displayName={partnerName}
                  avatarUrl={partnerAvatar}
                  isMe={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                    <Music2 size={28} className="text-zinc-600" strokeWidth={1} />
                  </div>
                  <p className="text-zinc-400 font-medium mb-1">Esperando a tu dupla</p>
                  <p className="text-xs text-zinc-600 max-w-[180px]">
                    Compartí el código{' '}
                    <code className="font-mono text-zinc-400">
                      {roomData.room.invite_code}
                    </code>{' '}
                    para que se unan
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* History feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card glass>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300">
                Historial de hoy
              </h2>
              <span className="text-xs text-zinc-600">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
            <ListeningHistoryFeed
              history={history}
              myUserId={myUserId}
              myName={myName}
              partnerName={partnerName}
              isLoading={historyLoading}
            />
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
