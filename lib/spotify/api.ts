import { SpotifyTrack } from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getSpotifyCurrentlyPlaying(
  accessToken: string
): Promise<SpotifyTrack | null> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);

  const data = await res.json();

  if (!data || !data.item || data.item.type !== 'track') return null;

  const track = data.item;
  return {
    track_id: track.id,
    track_name: track.name,
    artist_name: track.artists.map((a: { name: string }) => a.name).join(', '),
    album_name: track.album.name,
    album_art_url: track.album.images[0]?.url ?? '',
    track_url: track.external_urls.spotify,
    progress_ms: data.progress_ms ?? 0,
    duration_ms: track.duration_ms,
    is_playing: data.is_playing,
  };
}

export async function getSpotifyRecentlyPlayed(
  accessToken: string,
  limit = 20
): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map(
    (item: {
      track: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
        external_urls: { spotify: string };
        duration_ms: number;
      };
      played_at: string;
    }) => ({
      track_id: item.track.id,
      track_name: item.track.name,
      artist_name: item.track.artists
        .map((a: { name: string }) => a.name)
        .join(', '),
      album_name: item.track.album.name,
      album_art_url: item.track.album.images[0]?.url ?? '',
      track_url: item.track.external_urls.spotify,
      progress_ms: 0,
      duration_ms: item.track.duration_ms,
      is_playing: false,
    })
  );
}

export async function getSpotifyUserProfile(accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Spotify profile');
  return res.json();
}
