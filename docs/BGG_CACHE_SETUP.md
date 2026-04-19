# BGG Local Cache Setup Guide

This guide walks you through setting up the local BGG game cache, which eliminates all runtime BGG API calls.

## Overview

- **25,000+ games** cached locally in Supabase
- **Zero runtime BGG calls** - all searches and lookups are local
- **Daily auto-sync** at 3 AM to keep data fresh
- **~125MB storage** - well within Supabase free tier

---

## Step 1: Apply Database Migration

Run the migration to create the cache tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard:
# Go to SQL Editor and run the contents of:
# supabase/migrations/20240102000000_bgg_cache.sql
```

This creates:
- `bgg_games_cache` - Main game data table with full-text search
- `bgg_sync_log` - Sync history and monitoring
- Search functions for fast queries

---

## Step 2: Add Environment Variables

Add these to your `.env.local`:

```bash
# Already have these:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add this (from Supabase Dashboard > Settings > API):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Protect the sync admin endpoint
ADMIN_API_KEY=your-secret-admin-key
```

---

## Step 3: Initial Sync (First Time Only)

The initial sync will take **3-4 hours** to download 25,000 games. Run it once:

```bash
# Full sync of 25,000 games
node scripts/sync-bgg-cache.js

# Or start smaller to test (5,000 games, ~30 min)
node scripts/sync-bgg-cache.js --limit 5000

# Resume if interrupted
node scripts/sync-bgg-cache.js --resume
```

**Tip:** Run this overnight. The script shows progress and ETA.

---

## Step 4: Set Up Daily Sync (Cron Job)

### Option A: Supabase pg_cron (Recommended)

1. Go to Supabase Dashboard > Database > Extensions
2. Enable the `pg_cron` extension
3. Go to SQL Editor and run:

```sql
-- Schedule daily sync at 3 AM UTC
SELECT cron.schedule(
  'bgg-daily-sync',
  '0 3 * * *',  -- At 03:00 every day
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-bgg',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object('limit', 25000)
  );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job;
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

### Option B: External Cron (Railway, Vercel Cron, etc.)

Call the admin endpoint:

```bash
curl -X POST https://your-app.com/api/admin/sync-bgg \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 25000}'
```

### Option C: Local Machine Cron

Add to your crontab (`crontab -e`):

```bash
# Run at 3 AM daily
0 3 * * * cd /path/to/Mr.GameBoard && node scripts/sync-bgg-cache.js >> /tmp/bgg-sync.log 2>&1
```

---

## Step 5: Deploy Edge Function (Optional)

If using the Supabase Edge Function for syncs:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy sync-bgg
```

---

## Monitoring

### Check Sync Status

```bash
# Via API
curl https://your-app.com/api/admin/sync-bgg

# Or in Supabase SQL Editor
SELECT * FROM bgg_sync_log ORDER BY started_at DESC LIMIT 5;
```

### Check Cache Stats

```sql
-- Total games in cache
SELECT COUNT(*) FROM bgg_games_cache;

-- Games by rank range
SELECT 
  CASE 
    WHEN rank <= 1000 THEN 'Top 1000'
    WHEN rank <= 5000 THEN 'Top 5000'
    WHEN rank <= 10000 THEN 'Top 10000'
    ELSE 'Beyond 10000'
  END as tier,
  COUNT(*) as games
FROM bgg_games_cache
WHERE rank IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- Recently synced games
SELECT name, rank, rating, last_synced_at 
FROM bgg_games_cache 
ORDER BY last_synced_at DESC 
LIMIT 10;
```

---

## Troubleshooting

### "No games found" in searches
- Run the initial sync first: `node scripts/sync-bgg-cache.js`
- Check if the migration was applied: `SELECT COUNT(*) FROM bgg_games_cache;`

### Sync is slow
- BGG rate limits require 1 request/second
- 25,000 games ÷ 20 per batch = 1,250 requests
- At 1.1s/request = ~23 minutes just for API calls
- With DB writes and overhead = ~3-4 hours total

### Sync keeps failing
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure the migration was applied
- Check `bgg_sync_log` for error messages

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Your App                          │
│  ┌─────────────┐                                    │
│  │ lib/bgg.ts  │ ──────> Supabase Cache            │
│  │ (local only)│         (instant queries)          │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Background Sync (3 AM)                 │
│  ┌─────────────┐      ┌─────────────┐              │
│  │ BGG API     │ ───> │ Supabase    │              │
│  │ (25k games) │      │ Cache       │              │
│  └─────────────┘      └─────────────┘              │
└─────────────────────────────────────────────────────┘
```

**Key Point:** Your app NEVER calls BGG API at runtime. All game data comes from your local Supabase cache.

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20240102000000_bgg_cache.sql` | Database schema |
| `supabase/functions/sync-bgg/index.ts` | Edge Function for sync |
| `lib/bgg.ts` | Rewritten to use local cache only |
| `app/api/admin/sync-bgg/route.ts` | Admin API for manual sync |
| `scripts/sync-bgg-cache.js` | CLI sync script |

---

## FAQ

**Q: What if a game isn't in the cache?**
A: With 25,000 games, this is extremely rare. If it happens, the search simply won't find it. You can increase the sync limit to 50,000 if needed.

**Q: How fresh is the data?**
A: Data is synced daily at 3 AM. Ratings and rankings update frequently on BGG, but daily sync captures all meaningful changes.

**Q: Can I trigger a manual sync?**
A: Yes! Either run `node scripts/sync-bgg-cache.js` or POST to `/api/admin/sync-bgg`.

**Q: How much does this cost?**
A: The Supabase free tier includes 500MB storage. The cache uses ~125MB, well under the limit.
