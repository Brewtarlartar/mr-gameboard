# BGG Commercial License Application — Draft

Submit at: https://boardgamegeek.com/applications (choose **Commercial**).
Copy/adapt the sections below into the form fields. Personal details are yours
to fill; everything factual about the app is accurate as of 2026-08-30.

---

**Application name:** The Tome

**Applicant:** Javier Macias (javiermaciasproperties@gmail.com)

**URL:** https://the-tome.vercel.app (iOS and Android apps planned for late 2026)

**What the application does:**
The Tome is a board-game companion app for game nights: users keep a library
of the games they own, log play sessions with scores, track stats (streaks,
win rates, reigning champion), get a "what should we play tonight" picker, and
ask rules questions answered with references to official rulebooks. It is built
and run by a solo developer.

**How BoardGameGeek data is used:**
- Game metadata via the authenticated XML API2 (token already issued for this
  account): name, year, player counts, play time, weight, average rating, rank,
  categories, mechanics, designers, artists, publishers, and description.
- Metadata is cached server-side to minimize load on the BGG API; live API
  calls are rate-limited (2.5s spacing, batched thing requests) and used only
  for search and cache refresh. The monthly ranks CSV seeds new titles.
- Box-art images are hotlinked from BGG's CDN URLs, never copied or re-hosted.
- Game pages link back to their boardgamegeek.com pages, and the rulebook
  button falls back to the game's BGG files page. "Powered by BGG" attribution
  is displayed in the catalog.

**Commercial model:**
The app is currently free. Planned monetization (not yet live — this
application precedes it deliberately): a one-time premium unlock (advanced
stats and cosmetic features, ~$9.99) and an optional subscription for heavier
use of the AI rules assistant (~$4.99/month). Core features — library, play
logging, basic stats — will remain free. We understand the commercial license
is free until 100 paying subscribers and are applying ahead of need.

**AI usage — requesting clarification:**
The app includes an AI rules assistant. We understand that using BGG data to
TRAIN models is prohibited and we do not do so. At answer time, the assistant
may include a game's cached metadata (player counts, mechanics, the BGG
description) as context so it can answer questions about the right game —
i.e., inference-time context only, per-request, never training. We would like
written confirmation that this use is acceptable under the commercial license,
and are happy to adjust (e.g., exclude BGG description text from AI context)
if preferred.

**Volume:**
Small. Solo-developer scale: cache-first architecture keeps live API traffic
to search queries and a nightly refresh job well under typical rate limits.

**Attribution:**
"Powered by BGG" displayed; deep links back to boardgamegeek.com throughout.
Happy to meet any additional attribution requirements.
