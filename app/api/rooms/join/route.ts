import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const spotifyUserId = request.cookies.get('spotify_user_id')?.value;

  if (!spotifyUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { invite_code } = body;

  if (!invite_code || typeof invite_code !== 'string') {
    return NextResponse.json({ error: 'invite_code is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Find room by invite code
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, invite_code, created_by, created_at')
    .eq('invite_code', invite_code.toUpperCase().trim())
    .maybeSingle();

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Check member count
  const { count } = await supabase
    .from('room_members')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Room is full (max 2 members)' }, { status: 409 });
  }

  // Check if already a member
  const { data: alreadyMember } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', room.id)
    .eq('user_id', spotifyUserId)
    .maybeSingle();

  if (!alreadyMember) {
    const { error: insertError } = await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: spotifyUserId,
    });
    if (insertError) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }
  }

  return NextResponse.json({ room });
}
