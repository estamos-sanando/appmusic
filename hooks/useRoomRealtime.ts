'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NowPlaying } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRoomRealtimeOptions {
  roomId: string;
  partnerUserId: string | null;
  onNowPlayingUpdate?: (data: NowPlaying) => void;
}

export function useRoomRealtime({
  roomId,
  partnerUserId,
  onNowPlayingUpdate,
}: UseRoomRealtimeOptions) {
  const [partnerNowPlaying, setPartnerNowPlaying] = useState<NowPlaying | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const handlePayload = useCallback(
    (payload: { new: NowPlaying }) => {
      const updated = payload.new;
      if (!partnerUserId || updated.user_id !== partnerUserId) return;
      setPartnerNowPlaying(updated);
      onNowPlayingUpdate?.(updated);
    },
    [partnerUserId, onNowPlayingUpdate]
  );

  // Fetch initial partner state
  useEffect(() => {
    if (!partnerUserId) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from('now_playing')
        .select('*')
        .eq('user_id', partnerUserId)
        .maybeSingle();

      if (data) setPartnerNowPlaying(data);
    };

    fetchInitial();
  }, [partnerUserId, supabase]);

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-sync-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'now_playing',
        },
        handlePayload
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [roomId, supabase, handlePayload]);

  return { partnerNowPlaying, isConnected };
}
