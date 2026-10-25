import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email',
].join(' ');

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/spotify/callback`;

  if (!clientId) {
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'missing_client_id');
    return NextResponse.redirect(errorUrl);
  }

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );

  // Store state in cookie for CSRF protection
  response.cookies.set('spotify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
