-- Chronicle sync: play history + wishlist move from localStorage-only to
-- server-mirrored, following the library_games pattern (whole object in a
-- jsonb `data` column, client-side writes guarded by owner-only RLS).
-- Note: an older play_sessions migration exists in this repo but the table
-- was never present on the live DB — this creates the real one.

CREATE TABLE IF NOT EXISTS public.play_sessions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  played_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.play_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own play sessions" ON public.play_sessions;
CREATE POLICY "own play sessions" ON public.play_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_play_sessions_user_played
  ON public.play_sessions (user_id, played_at DESC);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own wishlist" ON public.wishlist_items;
CREATE POLICY "own wishlist" ON public.wishlist_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
