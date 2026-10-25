import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyCurrentlyPlaying } from '@/lib/spotify/api';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;
  const spotifyUserId = request.cookies.get('spotify_user_id')?.value;

  if (!accessToken || !spotifyUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const track = await getSpotifyCurrentlyPlaying(accessToken);
    const supabase = await createClient();

    if (track) {
      await supabase.from('now_playing').upsert(
        {
          user_id: spotifyUserId,
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
        },
        { onConflict: 'user_id' }
      );
    } else {
      // Mark as not playing
      await supabase
        .from('now_playing')
        .update({ is_playing: false, updated_at: new Date().toISOString() })
        .eq('user_id', spotifyUserId);
    }

    return NextResponse.json({ track });
  } catch (error) {
    console.error('[now-playing] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
