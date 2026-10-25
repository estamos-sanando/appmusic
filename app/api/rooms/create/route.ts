import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInviteCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const spotifyUserId = request.cookies.get('spotify_user_id')?.value;

  if (!spotifyUserId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = await createClient();

  // Check if user already has a room
  const { data: existingMembership } = await supabase
    .from('room_members')
    .select('room_id, rooms(id, invite_code, created_by, created_at)')
    .eq('user_id', spotifyUserId)
    .maybeSingle();

  if (existingMembership?.rooms) {
    return NextResponse.json({ room: existingMembership.rooms });
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    if (!existing) break;
    inviteCode = generateInviteCode();
  }

  // Create room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ invite_code: inviteCode, created_by: spotifyUserId })
    .select()
    .single();

  if (roomError || !room) {
    console.error('[rooms/create] Error:', roomError);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  // Add creator as first member
  await supabase.from('room_members').insert({
    room_id: room.id,
    user_id: spotifyUserId,
  });

  return NextResponse.json({ room }, { status: 201 });
}
