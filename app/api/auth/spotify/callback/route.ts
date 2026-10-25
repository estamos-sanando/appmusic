import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyUserProfile } from '@/lib/spotify/api';
import { createClient } from '@/lib/supabase/server';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/?error=spotify_denied`);
  }

  // Verify CSRF state
  const savedState = request.cookies.get('spotify_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  // Exchange code for tokens
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/spotify/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/?error=missing_client_id`);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error('Spotify token exchange failed:', await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Fetch Spotify user profile
  const spotifyProfile = await getSpotifyUserProfile(tokens.access_token);

  // Sign in/up with Supabase using Spotify email
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
    email: spotifyProfile.email,
    options: {
      shouldCreateUser: true,
      data: {
        full_name: spotifyProfile.display_name,
        avatar_url: spotifyProfile.images?.[0]?.url ?? null,
      },
    },
  });

  void authData;
  void authError;

  // Upsert profile with Spotify tokens
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('spotify_id', spotifyProfile.id)
    .maybeSingle();

  if (existingProfile) {
    await supabase
      .from('profiles')
      .update({
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        display_name: spotifyProfile.display_name,
        avatar_url: spotifyProfile.images?.[0]?.url ?? null,
      })
      .eq('id', existingProfile.id);
  }

  // Set session cookies
  const response = NextResponse.redirect(`${appUrl}/dashboard`);
  response.cookies.delete('spotify_oauth_state');

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax' as const,
  };

  response.cookies.set('spotify_access_token', tokens.access_token, {
    ...cookieOptions,
    maxAge: tokens.expires_in,
  });
  response.cookies.set('spotify_refresh_token', tokens.refresh_token ?? '', {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set('spotify_user_id', spotifyProfile.id, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set('spotify_expires_at', expiresAt, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60,
  });
  // Public cookies for client-side display
  response.cookies.set('dv_display_name', spotifyProfile.display_name ?? spotifyProfile.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set('dv_avatar', spotifyProfile.images?.[0]?.url ?? '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set('dv_spotify_id', spotifyProfile.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
