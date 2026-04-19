# Mr. GameBoard

Your board game companion: library, discovery, play tracking, and stats. Built as a mobile-first PWA and packaged for iOS/Android via Capacitor.

## The app in five tabs

- **Library** — your collection. Search BoardGameGeek, add favorites, filter by wishlist.
- **Discover** — curated lists (Top 500, Party, Family, Strategy) to browse and save.
- **Play** — pick a game, set up players, run a session with scoring, dice, and a turn timer. Crash-resumable drafts mean a phone call never loses your scores.
- **Stats** — play history, most-played games, days-since-last-played, H-index, and per-game win rate.
- **Me** — profile, optional cloud sync, data export (JSON/CSV), settings.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Zustand (persisted local state — offline-first source of truth)
- Supabase (optional cloud sync and BGG cache)
- BoardGameGeek XML API
- Capacitor 6 (iOS/Android wrap)

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run lint
npm run build      # web production build
```

### Environment

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Both are optional — the app is offline-first and functions without an account.

## Mobile (Capacitor)

First-time setup:

```bash
npm install
npm run cap:add:ios       # or cap:add:android
npm run cap:sync          # builds Next in export mode, syncs native projects
npm run cap:ios           # opens Xcode
npm run cap:android       # opens Android Studio
```

`cap:sync` sets `CAPACITOR_BUILD=1`, which enables Next's static `output: 'export'`. API routes (`/api/bgg/*`, `/api/discover`, `/api/library/enrich`) must be migrated to client-side fetches before the static build can succeed — the BGG XML API is CORS-friendly from native webviews.

## Data

Supabase schema lives in `supabase/migrations/`. The most recent migration (`20260416000000_mobile_cleanup.sql`) drops the tables for features cut in the mobile launch (`achievements`, `strategies`, `wishlist`, `game_nights`) and adds `score_template`, `session_mode`, and `coop_outcome`.

Local state (library, play history, active session drafts) is stored via `zustand/persist` and survives app kills. The `/me` tab exports it as JSON or CSV.

## License

Private project.
