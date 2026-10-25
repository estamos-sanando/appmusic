import { createClient } from '@/lib/supabase/server';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export async function refreshSpotifyToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('spotify_refresh_token, spotify_access_token, token_expires_at')
    .eq('id', userId)
    .single();

  if (error || !profile?.spotify_refresh_token) {
    console.error('[refreshSpotifyToken] No refresh token found:', error);
    return null;
  }

  // Check if token is still valid (with 1-minute buffer)
  if (profile.token_expires_at) {
    const expiresAt = new Date(profile.token_expires_at).getTime();
    if (Date.now() < expiresAt - 60_000) {
      return profile.spotify_access_token ?? null;
    }
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: profile.spotify_refresh_token,
    }),
  });

  if (!res.ok) {
    console.error('[refreshSpotifyToken] Failed to refresh:', await res.text());
    return null;
  }

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('profiles')
    .update({
      spotify_access_token: tokens.access_token,
      token_expires_at: expiresAt,
      ...(tokens.refresh_token && { spotify_refresh_token: tokens.refresh_token }),
    })
    .eq('id', userId);

  return tokens.access_token as string;
}
