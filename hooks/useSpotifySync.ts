'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SpotifyTrack } from '@/types';

const POLL_INTERVAL_MS = 7000;
const MIN_PLAY_DURATION_MS = 30000;

interface UseSpotifySyncOptions {
  userId: string;
  enabled?: boolean;
  onTrackChange?: (track: SpotifyTrack | null) => void;
}

export function useSpotifySync({ userId, enabled = true, onTrackChange }: UseSpotifySyncOptions) {
  const lastTrackIdRef = useRef<string | null>(null);
  const lastTrackStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const supabase = createClient();

  const saveToHistory = useCallback(
    async (track: SpotifyTrack) => {
      await supabase.from('listening_history').insert({
        user_id: userId,
        track_id: track.track_id,
        track_name: track.track_name,
        artist_name: track.artist_name,
        album_name: track.album_name,
        album_art_url: track.album_art_url,
        track_url: track.track_url,
        played_at: new Date().toISOString(),
      });
    },
    [supabase, userId]
  );

  const poll = useCallback(async () => {
    if (!isVisibleRef.current) return;

    try {
      const res = await fetch('/api/spotify/now-playing', { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();
      const track: SpotifyTrack | null = data.track;

      onTrackChange?.(track);

      if (!track) {
        lastTrackIdRef.current = null;
        lastTrackStartRef.current = null;
        return;
      }

      // Detect track change — save previous track to history if played enough
      if (track.track_id !== lastTrackIdRef.current) {
        const prevTrackId = lastTrackIdRef.current;
        const prevStartTime = lastTrackStartRef.current;

        if (prevTrackId && prevStartTime) {
          const listenedMs = Date.now() - prevStartTime;
          if (listenedMs >= MIN_PLAY_DURATION_MS) {
            // We don't have the previous track data anymore; history will come from the DB
            // The upsert in the API route already captured it
          }
        }

        // New track started — save to history if progress indicates it started fresh
        if (track.progress_ms < 10000) {
          await saveToHistory(track);
        }

        lastTrackIdRef.current = track.track_id;
        lastTrackStartRef.current = Date.now();
      }
    } catch (err) {
      console.error('[useSpotifySync] Poll error:', err);
    }
  }, [onTrackChange, saveToHistory]);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Handle tab visibility
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
        poll(); // Immediate poll on tab focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Initial poll
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, userId, poll]);
}
