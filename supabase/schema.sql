-- ============================================================
-- DuoVibe – Supabase Schema (idempotent: safe to re-run)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT,
  avatar_url            TEXT,
  spotify_id            TEXT        UNIQUE,
  spotify_access_token  TEXT,
  spotify_refresh_token TEXT,
  token_expires_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- rooms -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code VARCHAR(8)  UNIQUE NOT NULL CHECK (invite_code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_by  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- room_members ------------------------------------------------
-- A user belongs to at most ONE room (UNIQUE user_id); a room holds at most 2 users (trigger).
CREATE TABLE IF NOT EXISTS public.room_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID        NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- now_playing -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.now_playing (
  user_id       UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id      TEXT,
  track_name    TEXT,
  artist_name   TEXT,
  album_name    TEXT,
  album_art_url TEXT,
  track_url     TEXT,
  progress_ms   INT         NOT NULL DEFAULT 0,
  duration_ms   INT         NOT NULL DEFAULT 0,
  is_playing    BOOLEAN     NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- listening_history -------------------------------------------
CREATE TABLE IF NOT EXISTS public.listening_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id      TEXT,
  track_name    TEXT,
  artist_name   TEXT,
  album_name    TEXT,
  album_art_url TEXT,
  track_url     TEXT,
  played_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listening_history_user_id
  ON public.listening_history (user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at
  ON public.listening_history (played_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_played
  ON public.listening_history (user_id, played_at DESC);

-- ============================================================
-- COLUMN-LEVEL PRIVILEGES
-- Spotify tokens must never be readable from the browser. Only the
-- service role (server) can read/write them.
-- ============================================================
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, spotify_id, created_at) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url) ON public.profiles TO authenticated;

REVOKE ALL ON public.rooms, public.room_members FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.rooms, public.room_members FROM authenticated; -- mutations go through RPCs
REVOKE ALL ON public.now_playing, public.listening_history FROM anon;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER → avoid RLS recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.are_room_partners(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members rm1
    JOIN public.room_members rm2 ON rm1.room_id = rm2.room_id
    WHERE rm1.user_id = user_a AND rm2.user_id = user_b
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, 1 + (get_byte(gen_random_bytes(1), 0) % length(chars)), 1);
  END LOOP;
  RETURN code;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Max 2 members per room (backstop; RPCs also lock the room row)
CREATE OR REPLACE FUNCTION public.check_room_max_members()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.room_members WHERE room_id = NEW.room_id) >= 2 THEN
    RAISE EXCEPTION 'ROOM_FULL' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_room_max_members ON public.room_members;
CREATE TRIGGER trg_check_room_max_members
  BEFORE INSERT ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION public.check_room_max_members();

-- History dedupe safety net (e.g. two open tabs committing the same play)
CREATE OR REPLACE FUNCTION public.skip_duplicate_history()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.listening_history
    WHERE user_id = NEW.user_id
      AND track_id IS NOT DISTINCT FROM NEW.track_id
      AND abs(extract(epoch FROM (played_at - NEW.played_at))) < 90
  ) THEN
    RETURN NULL; -- silently skip duplicate
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_skip_duplicate_history ON public.listening_history;
CREATE TRIGGER trg_skip_duplicate_history
  BEFORE INSERT ON public.listening_history
  FOR EACH ROW EXECUTE FUNCTION public.skip_duplicate_history();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, spotify_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'spotify_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROOM RPCs (atomic, race-safe)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_room()
RETURNS public.rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_room    public.rooms;
  v_attempt INT  := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- Already in a room → return it
  SELECT r.* INTO v_room
  FROM public.rooms r
  JOIN public.room_members m ON m.room_id = r.id
  WHERE m.user_id = v_uid;
  IF FOUND THEN
    RETURN v_room;
  END IF;

  LOOP
    BEGIN
      INSERT INTO public.rooms (invite_code, created_by)
      VALUES (public.generate_invite_code(), v_uid)
      RETURNING * INTO v_room;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_attempt := v_attempt + 1;
      IF v_attempt >= 5 THEN RAISE; END IF;
    END;
  END LOOP;

  INSERT INTO public.room_members (room_id, user_id) VALUES (v_room.id, v_uid);
  RETURN v_room;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room(p_invite_code TEXT)
RETURNS public.rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_room    public.rooms;
  v_current UUID;
  v_count   INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_room
  FROM public.rooms
  WHERE invite_code = upper(trim(p_invite_code))
  FOR UPDATE; -- serialize concurrent joins
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT room_id INTO v_current FROM public.room_members WHERE user_id = v_uid;
  IF v_current = v_room.id THEN
    RETURN v_room; -- already a member
  END IF;

  IF v_current IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.room_members WHERE room_id = v_current;
    IF v_count > 1 THEN
      RAISE EXCEPTION 'ALREADY_IN_ROOM' USING ERRCODE = 'P0001';
    END IF;
    -- User was alone in their own room → discard it and join the new one
    DELETE FROM public.rooms WHERE id = v_current;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.room_members WHERE room_id = v_room.id;
  IF v_count >= 2 THEN
    RAISE EXCEPTION 'ROOM_FULL' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.room_members (room_id, user_id) VALUES (v_room.id, v_uid);
  RETURN v_room;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_room()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_room UUID;
  v_left INT;
BEGIN
  DELETE FROM public.room_members WHERE user_id = v_uid RETURNING room_id INTO v_room;
  IF v_room IS NULL THEN RETURN; END IF;
  SELECT COUNT(*) INTO v_left FROM public.room_members WHERE room_id = v_room;
  IF v_left = 0 THEN
    DELETE FROM public.rooms WHERE id = v_room;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_room(), public.join_room(TEXT), public.leave_room() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_room(), public.join_room(TEXT), public.leave_room() TO authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_playing       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- profiles: self or room partner
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_partner" ON public.profiles;
CREATE POLICY "profiles_select_self_or_partner" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.are_room_partners(auth.uid(), id));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- rooms: members only (create/join via RPC)
DROP POLICY IF EXISTS "rooms_select_members" ON public.rooms;
CREATE POLICY "rooms_select_members" ON public.rooms
  FOR SELECT TO authenticated
  USING (public.is_room_member(id));

DROP POLICY IF EXISTS "rooms_insert_authenticated" ON public.rooms;

-- room_members: members of the same room (no self-reference → no recursion)
DROP POLICY IF EXISTS "room_members_select_same_room" ON public.room_members;
CREATE POLICY "room_members_select_same_room" ON public.room_members
  FOR SELECT TO authenticated
  USING (public.is_room_member(room_id));

DROP POLICY IF EXISTS "room_members_insert_own" ON public.room_members;

-- now_playing
DROP POLICY IF EXISTS "now_playing_select_self_or_partner" ON public.now_playing;
CREATE POLICY "now_playing_select_self_or_partner" ON public.now_playing
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.are_room_partners(auth.uid(), user_id));

DROP POLICY IF EXISTS "now_playing_insert_own" ON public.now_playing;
CREATE POLICY "now_playing_insert_own" ON public.now_playing
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "now_playing_update_own" ON public.now_playing;
CREATE POLICY "now_playing_update_own" ON public.now_playing
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- listening_history
DROP POLICY IF EXISTS "listening_history_select_self_or_partner" ON public.listening_history;
CREATE POLICY "listening_history_select_self_or_partner" ON public.listening_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.are_room_partners(auth.uid(), user_id));

DROP POLICY IF EXISTS "listening_history_insert_own" ON public.listening_history;
CREATE POLICY "listening_history_insert_own" ON public.listening_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['now_playing', 'listening_history', 'room_members'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
