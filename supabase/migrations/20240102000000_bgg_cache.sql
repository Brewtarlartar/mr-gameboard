-- BGG Games Cache - Local mirror of BoardGameGeek data
-- This eliminates runtime BGG API calls by caching 25k+ games locally

-- Main games cache table
CREATE TABLE public.bgg_games_cache (
  bgg_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  thumbnail TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  min_playing_time INTEGER,
  max_playing_time INTEGER,
  complexity DECIMAL(3,2),
  rating DECIMAL(4,2),
  year_published INTEGER,
  rank INTEGER,
  categories JSONB DEFAULT '[]'::jsonb,
  mechanics JSONB DEFAULT '[]'::jsonb,
  designers JSONB DEFAULT '[]'::jsonb,
  artists JSONB DEFAULT '[]'::jsonb,
  publishers JSONB DEFAULT '[]'::jsonb,
  -- Full-text search vector
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'D')
  ) STORED,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync log table to track sync progress and errors
CREATE TABLE public.bgg_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'partial')) DEFAULT 'running',
  games_synced INTEGER DEFAULT 0,
  games_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb
);

-- Indexes for fast queries
CREATE INDEX idx_bgg_cache_rank ON public.bgg_games_cache(rank) WHERE rank IS NOT NULL;
CREATE INDEX idx_bgg_cache_rating ON public.bgg_games_cache(rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX idx_bgg_cache_name ON public.bgg_games_cache(name);
CREATE INDEX idx_bgg_cache_year ON public.bgg_games_cache(year_published DESC);
CREATE INDEX idx_bgg_cache_players ON public.bgg_games_cache(min_players, max_players);
CREATE INDEX idx_bgg_cache_complexity ON public.bgg_games_cache(complexity);

-- GIN index for full-text search
CREATE INDEX idx_bgg_cache_search ON public.bgg_games_cache USING GIN(search_vector);

-- GIN indexes for JSONB array queries
CREATE INDEX idx_bgg_cache_categories ON public.bgg_games_cache USING GIN(categories);
CREATE INDEX idx_bgg_cache_mechanics ON public.bgg_games_cache USING GIN(mechanics);

-- Enable Row Level Security (but allow public read access)
ALTER TABLE public.bgg_games_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bgg_sync_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read the cache (it's public reference data)
CREATE POLICY "Anyone can read bgg cache" ON public.bgg_games_cache
  FOR SELECT USING (true);

-- Only service role can write to cache (for sync function)
CREATE POLICY "Service role can manage bgg cache" ON public.bgg_games_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Only service role can manage sync logs
CREATE POLICY "Service role can manage sync logs" ON public.bgg_sync_log
  FOR ALL USING (auth.role() = 'service_role');

-- Function to search games with full-text search
CREATE OR REPLACE FUNCTION search_bgg_games(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  bgg_id INTEGER,
  name TEXT,
  year_published INTEGER,
  rating DECIMAL,
  rank INTEGER,
  thumbnail TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.bgg_id,
    g.name,
    g.year_published,
    g.rating,
    g.rank,
    g.thumbnail,
    ts_rank(g.search_vector, websearch_to_tsquery('english', search_query)) AS relevance
  FROM public.bgg_games_cache g
  WHERE g.search_vector @@ websearch_to_tsquery('english', search_query)
     OR g.name ILIKE '%' || search_query || '%'
  ORDER BY 
    CASE WHEN g.name ILIKE search_query THEN 0
         WHEN g.name ILIKE search_query || '%' THEN 1
         WHEN g.name ILIKE '%' || search_query || '%' THEN 2
         ELSE 3
    END,
    ts_rank(g.search_vector, websearch_to_tsquery('english', search_query)) DESC,
    g.rank ASC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get games by player count
CREATE OR REPLACE FUNCTION get_games_by_player_count(
  player_count INTEGER,
  result_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.bgg_games_cache AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.bgg_games_cache
  WHERE min_players <= player_count 
    AND max_players >= player_count
  ORDER BY rating DESC NULLS LAST, rank ASC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comment for documentation
COMMENT ON TABLE public.bgg_games_cache IS 'Local cache of BoardGameGeek game data. Synced daily at 3 AM.';
COMMENT ON TABLE public.bgg_sync_log IS 'Log of BGG sync operations for monitoring and debugging.';
