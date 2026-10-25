export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  spotify_id: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface NowPlaying {
  user_id: string;
  track_id: string | null;
  track_name: string | null;
  artist_name: string | null;
  album_name: string | null;
  album_art_url: string | null;
  track_url: string | null;
  progress_ms: number;
  duration_ms: number;
  is_playing: boolean;
  updated_at: string;
}

export interface ListeningHistoryItem {
  id: string;
  user_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string | null;
  album_art_url: string | null;
  track_url: string | null;
  played_at: string;
  profile?: Profile;
}

export interface SpotifyTrack {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  track_url: string;
  progress_ms: number;
  duration_ms: number;
  is_playing: boolean;
}

export interface RoomWithMembers extends Room {
  members: RoomMember[];
}

export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
};

// ------------------------------------------------------------
// Sync / API contracts
// ------------------------------------------------------------

/** Normalized playback status returned by GET /api/spotify/now-playing */
export type PlaybackStatus = 'playing' | 'paused' | 'idle' | 'unsupported';

export interface NowPlayingResponse {
  status: PlaybackStatus;
  track: SpotifyTrack | null;
  /** e.g. 'episode' | 'ad' when status === 'unsupported' */
  unsupportedType?: string;
  fetchedAt: string;
}

export type SyncErrorCode =
  | 'UNAUTHENTICATED'
  | 'SPOTIFY_REAUTH'
  | 'SPOTIFY_FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SPOTIFY_UNAVAILABLE'
  | 'NETWORK'
  | 'INTERNAL';

export type RoomErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_CODE'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ALREADY_IN_ROOM'
  | 'INTERNAL';

export interface ApiErrorBody<C extends string = string> {
  error: {
    code: C;
    message: string;
    /** Seconds until the client may retry (rate limiting) */
    retryAfter?: number;
  };
}
