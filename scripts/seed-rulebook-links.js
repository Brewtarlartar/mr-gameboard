#!/usr/bin/env node

/**
 * AI-assisted rulebook-link discovery (supervised).
 *
 * For top-ranked games with no rulebook link yet, Claude web-searches for the
 * OFFICIAL rulebook (publisher-hosted PDF or rules page) and writes candidates
 * into rulebook_links as status='pending'. Nothing is served to users until a
 * human approves it in the admin review page (/admin/rulebooks) — mirror sites
 * are explicitly excluded by the prompt AND rejected at review.
 *
 * Usage:
 *   node scripts/seed-rulebook-links.js --limit 25          # next 25 unlinked by rank
 *   node scripts/seed-rulebook-links.js --limit 100 --min-rank 1 --max-rank 100
 *
 * Requirements (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * ANTHROPIC_API_KEY. Rough cost: ~$0.05-0.15 per game (web search + Opus).
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const args = process.argv.slice(2);
const argVal = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? parseInt(args[i + 1], 10) : dflt;
};
const LIMIT = argVal('--limit', 25);
const MIN_RANK = argVal('--min-rank', 1);
const MAX_RANK = argVal('--max-rank', 1000);

const MIRROR_HOSTS = ['1j1ju.com', '1jour-1jeu.com'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isMirror(url) {
  try {
    const host = new URL(url).hostname;
    return MIRROR_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return true;
  }
}

async function findLink(game) {
  const publishers = (game.publishers || []).slice(0, 3).join(', ') || 'unknown publisher';
  const prompt = `Find the OFFICIAL rulebook link for the board game "${game.name}" (${game.year_published || 'year unknown'}, published by ${publishers}).

Rules for what counts:
- STRONGLY prefer a direct PDF hosted on the publisher's own domain or their official CDN (e.g. stonemaiergames.com, images-cdn.fantasyflightgames.com, cdn.svc.asmodee.net, gmtgames.com, czechgames.com, renegadegamestudios.com).
- A publisher's official rules/downloads PAGE for this game is acceptable when no direct PDF exists.
- NEVER return fan re-hosts or mirror sites (1j1ju.com, scribd, boardgamecapital, ultraboardgames, drive.google.com shares, archive.org) — official publisher sources only.
- If you cannot find an official source, say so honestly.

Answer with ONLY a JSON object, no other text:
{"url": "https://..." or null, "source_type": "publisher_pdf" or "publisher_page", "confidence": "high"|"medium"|"low", "note": "one short sentence on what this is"}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 2000,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
    messages: [{ role: 'user', content: prompt }],
  });

  // The final text block carries the JSON verdict.
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Seeding rulebook links: up to ${LIMIT} games, ranks ${MIN_RANK}-${MAX_RANK}…`);

  // Games in range that have no link row at all yet (any status).
  const { data: linked, error: linkErr } = await supabase
    .from('rulebook_links')
    .select('bgg_id');
  if (linkErr) throw new Error(linkErr.message);
  const linkedIds = new Set((linked ?? []).map((r) => r.bgg_id));

  const { data: rows, error } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id, name, year_published, rank, publishers')
    .gte('rank', MIN_RANK)
    .lte('rank', MAX_RANK)
    .order('rank', { ascending: true });
  if (error) throw new Error(error.message);

  const targets = rows.filter((r) => !linkedIds.has(r.bgg_id)).slice(0, LIMIT);
  console.log(`${targets.length} games to research (~$${(targets.length * 0.1).toFixed(2)} est.)`);

  let found = 0;
  let missed = 0;
  for (const game of targets) {
    let verdict = null;
    try {
      verdict = await findLink(game);
    } catch (err) {
      console.warn(`  ${game.name}: API error (${err.message}) — skipping`);
      await sleep(3000);
      continue;
    }

    if (!verdict?.url || isMirror(verdict.url)) {
      missed++;
      console.log(`  #${game.rank} ${game.name}: no official source found`);
      // Record the miss so re-runs skip it (a human can delete to retry).
      await supabase.from('rulebook_links').insert({
        bgg_id: game.bgg_id,
        url: `https://boardgamegeek.com/boardgame/${game.bgg_id}/files`,
        source_type: 'bgg_files',
        status: 'rejected',
        label: 'auto: no official source found',
      });
      continue;
    }

    const sourceType = verdict.source_type === 'publisher_page' ? 'publisher_page' : 'publisher_pdf';
    const { error: insErr } = await supabase.from('rulebook_links').insert({
      bgg_id: game.bgg_id,
      url: verdict.url,
      source_type: sourceType,
      status: 'pending',
      label: `${verdict.confidence || '?'} confidence: ${(verdict.note || '').slice(0, 200)}`,
    });
    if (insErr) {
      console.warn(`  ${game.name}: insert failed (${insErr.message})`);
    } else {
      found++;
      console.log(`  #${game.rank} ${game.name}: ${verdict.url} [${verdict.confidence}]`);
    }
    await sleep(1000);
  }

  console.log(`\nDone: ${found} candidates pending review, ${missed} without an official source.`);
  console.log('Review at /admin/rulebooks (needs CRON_SECRET).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
