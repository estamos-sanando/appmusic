import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyRecentlyPlayed } from '@/lib/spotify/api';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const tracks = await getSpotifyRecentlyPlayed(accessToken, 10);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('[history] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
