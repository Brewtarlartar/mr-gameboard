# Mr. GameBoard — User Guide

Five tabs, one purpose: get you from "what should we play?" to "here's the scoresheet" without a detour.

## Library

Your collection. Add games three ways:

1. **Search BoardGameGeek** — type a name, tap the result, it saves with artwork and metadata.
2. **From Discover** — tap any game in a curated list to add it.
3. **Custom** — use the "Add custom" option for prototypes or games BGG doesn't know.

**Filters:** All · Favorites · Wishlist. Toggle the heart icon on any card to favorite; toggle the bookmark to wishlist.

## Discover

Curated lists powered by BGG ranks:

- **Top 500** — the overall rank leaderboard.
- **Party** — crowd-pleasers for mixed groups.
- **Family** — light, accessible, kid-friendly.
- **Strategy** — heavier, longer, meatier.

Tap any game to see details or add it to your library.

## Play

Three steps: **select → setup → playing.**

1. **Select** a game from your library.
2. **Setup** players (name, optional role/class/rank/race attributes).
3. **Playing** opens the session dashboard: setup guide, utilities sidebar, live leaderboard.

### Session utilities (sidebar)

- **Score** — auto-detects a template for the chosen game (Wingspan, Catan, Scythe, Terraforming Mars, Everdell, Azul, Ticket to Ride, or a simple total). Switch modes with the top toggle:
  - **Versus** — classic competitive scoring, highest total wins.
  - **Co-op** — one group outcome (Victory / Defeat).
  - **Teams** — assign each player to Team A–D; team totals show on top.
- **Dice** — configurable d-roller.
- **Timer** — turn timer for games with a shot clock.

### Crash-resumable sessions

Your active session auto-saves to local storage on every change. Kill the app, take a phone call, reboot — reopen Play and a resume banner appears. Draft expires after 24 hours so stale sessions don't ambush you.

## Stats

All computed locally from your logged play sessions:

- **Sessions / Hours / Players / H-Index** — top-line stats.
- **Most played** — ranked, with days-since-last-played and your win rate per game.
- **Last 30 days** — daily heatmap.
- **Average session length** and **unique games played**.

H-Index follows BGG's definition: you have an H-index of N if you've played N games at least N times each.

## Me

- **Cloud sync** — optional. Sign in to sync library and play history across devices via Supabase. Skip it and everything still works.
- **Export** — download your library or play history as JSON or CSV. Your data, portable.
- **Clear all data** — wipes local state. Requires a confirm tap.

## Offline-first

Library, Discover (from bundled lists), Play, and Stats all work without a network. BGG search requires connectivity and fails gracefully when offline.
