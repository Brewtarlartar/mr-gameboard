#!/usr/bin/env node

/**
 * Backfill empty publishers/designers/artists arrays on ranked cache rows.
 *
 * The ranked rows were seeded by paths that dropped these link arrays; the
 * publisher-domain rulebook seeding strategy needs publishers populated.
 * Only rows whose arrays are empty are touched, and only empty columns are
 * overwritten.
 *
 * Usage:
 *   node scripts/backfill-publishers.js               # ranks 1-1000
 *   node scripts/backfill-publishers.js --max-rank 5000
 *
 * Requirements (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * BGG_API_TOKEN (recommended — anonymous XML API calls 401 since 2026).
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const BATCH_SIZE = 20;
const RATE_LIMIT_MS = 2500;

const args = process.argv.slice(2);
const maxRankIdx = args.indexOf('--max-rank');
const MAX_RANK = maxRankIdx !== -1 ? parseInt(args[maxRankIdx + 1], 10) : 1000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function bggAuthHeaders() {
  const headers = {
    Accept: 'application/xml, text/xml, */*',
    'User-Agent': process.env.BGG_USER_AGENT || 'TheTome/1.0 (mr-gameboard)',
  };
  const token = process.env.BGG_API_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseXMLLinks(xml, type) {
  const out = [];
  const re = new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]*)"`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Backfilling publishers for ranked rows (rank 1-${MAX_RANK})…`);

  const { data: rows, error } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id, rank, publishers')
    .gte('rank', 1)
    .lte('rank', MAX_RANK)
    .order('rank', { ascending: true })
    .limit(MAX_RANK + 100);
  if (error) throw new Error(`select failed: ${error.message}`);

  const targets = rows.filter((r) => !r.publishers || r.publishers.length === 0);
  console.log(`${rows.length} ranked rows, ${targets.length} with empty publishers.`);
  if (targets.length === 0) return;

  let updated = 0;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const ids = batch.map((r) => r.bgg_id).join(',');
    const url = `${BGG_API_BASE}/thing?id=${ids}&stats=1`;

    let xml;
    try {
      const res = await axios.get(url, { headers: bggAuthHeaders(), timeout: 30000 });
      xml = res.data;
    } catch (err) {
      console.warn(`batch ${i / BATCH_SIZE + 1}: fetch failed (${err.message}) — skipping`);
      await sleep(RATE_LIMIT_MS * 2);
      continue;
    }

    const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const bggId = parseInt(m[1], 10);
      const itemXml = m[2];
      const publishers = parseXMLLinks(itemXml, 'boardgamepublisher');
      const designers = parseXMLLinks(itemXml, 'boardgamedesigner');
      const artists = parseXMLLinks(itemXml, 'boardgameartist');
      if (publishers.length === 0) continue;

      const patch = { publishers };
      if (designers.length > 0) patch.designers = designers;
      if (artists.length > 0) patch.artists = artists;

      // Targets were selected as empty-publishers rows; updating by id alone
      // is safe (nothing else writes these columns concurrently).
      const { error: upErr } = await supabase
        .from('bgg_games_cache')
        .update(patch)
        .eq('bgg_id', bggId);
      if (upErr) {
        console.warn(`update ${bggId} failed: ${upErr.message}`);
      } else {
        updated++;
      }
    }

    process.stdout.write(
      `\r${Math.min(i + BATCH_SIZE, targets.length)}/${targets.length} processed, ${updated} updated`,
    );
    await sleep(RATE_LIMIT_MS);
  }
  console.log(`\nDone: ${updated} rows backfilled.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
