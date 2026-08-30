-- In-app "report this answer" intake for Oracle responses.
-- Required by Google Play's AI-Generated Content policy (in-app reporting of
-- AI output) and doubles as the accuracy-feedback loop. Rows are written only
-- by the server with the service role; RLS is enabled with NO policies on
-- purpose so anon/authenticated clients can neither read nor write reports.
CREATE TABLE IF NOT EXISTS public.ai_response_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,
  bgg_id INTEGER,
  game_name TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  reason TEXT,
  grounded BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'fixed', 'dismissed'))
);

ALTER TABLE public.ai_response_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_response_reports_status
  ON public.ai_response_reports (status, created_at DESC);
