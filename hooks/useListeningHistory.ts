'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { ListeningHistoryItem } from '@/types';

const fetcher = async (roomId: string): Promise<ListeningHistoryItem[]> => {
  const supabase = createClient();

  // Get today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('listening_history')
    .select(
      `
      *,
      profile:profiles(id, display_name, avatar_url, spotify_id)
    `
    )
    .gte('played_at', todayStart.toISOString())
    .order('played_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as ListeningHistoryItem[];
};

export function useListeningHistory(roomId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    roomId ? `history-${roomId}` : null,
    () => fetcher(roomId),
    {
      refreshInterval: 15000, // Re-fetch every 15 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    history: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
