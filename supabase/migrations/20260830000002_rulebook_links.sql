-- Rulebook links: the source of truth for OFFICIAL rules links, replacing the
-- ad-hoc rulebook_public_url column. Link-only posture: we link to publisher
-- sources, never re-host, and never serve community mirror sites.
--
-- The approved winner per game is denormalized into bgg_games_cache.rulebook_url,
-- which /api/rulebook/[bggId] already reads (falling back to the BGG files page,
-- then Google, so every game keeps a working button).
--
-- RLS is enabled with NO policies: reads and writes go through server routes /
-- scripts with the service role (user link submissions arrive via an API route,
-- never direct table access — link injection needs review by a human).

CREATE TABLE IF NOT EXISTS public.rulebook_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (
    source_type IN ('publisher_pdf', 'publisher_page', 'bgg_files', 'community_mirror', 'user_submitted')
  ),
  language TEXT NOT NULL DEFAULT 'en',
  label TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'dead')),
  submitted_by UUID,
  fail_count INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bgg_id, url)
);

ALTER TABLE public.rulebook_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rulebook_links_bgg_status
  ON public.rulebook_links (bgg_id, status);
CREATE INDEX IF NOT EXISTS idx_rulebook_links_status
  ON public.rulebook_links (status, created_at DESC);

-- Migrate the legacy rulebook_public_url rows: publisher-direct links become
-- approved publisher_pdf entries; 1j1ju mirror links are preserved as rejected
-- community_mirror rows (never served, kept as discovery hints).
INSERT INTO public.rulebook_links (bgg_id, url, source_type, status, verified_at)
SELECT
  bgg_id,
  rulebook_public_url,
  CASE WHEN rulebook_public_url ~* '1j1ju|1jour-1jeu' THEN 'community_mirror' ELSE 'publisher_pdf' END,
  CASE WHEN rulebook_public_url ~* '1j1ju|1jour-1jeu' THEN 'rejected' ELSE 'approved' END,
  NOW()
FROM public.bgg_games_cache
WHERE rulebook_public_url IS NOT NULL
ON CONFLICT (bgg_id, url) DO NOTHING;

-- Denormalize approved official links into the column the rulebook route reads.
UPDATE public.bgg_games_cache c
SET rulebook_url = l.url
FROM public.rulebook_links l
WHERE l.bgg_id = c.bgg_id
  AND l.status = 'approved'
  AND l.source_type IN ('publisher_pdf', 'publisher_page');

-- Retire the legacy column's data: approved links now flow via rulebook_url,
-- and mirror links must not be served at all.
UPDATE public.bgg_games_cache
SET rulebook_public_url = NULL
WHERE rulebook_public_url IS NOT NULL;
