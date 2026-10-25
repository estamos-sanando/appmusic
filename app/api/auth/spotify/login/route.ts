import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email',
].join(' ');

export async function GET() {
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SPOTIFY_SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
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
