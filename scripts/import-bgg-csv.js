#!/usr/bin/env node

/**
 * Import the BGG public CSV ranks dump into bgg_games_cache.
 *
 * Source: https://boardgamegeek.com/data_dumps/bg_ranks  (logged-in BGG account)
 *
 * What this does:
 *   - Streams the CSV (it's ~176k rows, 11 MB).
 *   - Skips expansions (is_expansion=1) by default.
 *   - Upserts each game by bgg_id, setting only the columns the CSV provides
 *     (name, year_published, rank, rating, last_synced_at).
 *   - Existing rich data (description, image, thumbnail, categories,
 *     mechanics, etc.) is preserved on rows that already exist.
 *
 * Usage:
 *   node scripts/import-bgg-csv.js /Users/javied/Downloads/boardgames_ranks.csv
 *   node scripts/import-bgg-csv.js path/to/ranks.csv --include-expansions
 *   node scripts/import-bgg-csv.js path/to/ranks.csv --limit 5000
 *   node scripts/import-bgg-csv.js path/to/ranks.csv --min-rated 25      # require ≥25 user ratings
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- minimal .env.local loader (avoids needing the dotenv dep) ---
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith('--'));
const includeExpansions = args.includes('--include-expansions');
const limitArg = args.indexOf('--limit');
const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : Infinity;
const minRatedArg = args.indexOf('--min-rated');
const minRated = minRatedArg >= 0 ? parseInt(args[minRatedArg + 1], 10) : 0;

if (!csvPath) {
  console.error('Usage: node scripts/import-bgg-csv.js <path-to-csv> [--include-expansions] [--limit N] [--min-rated N]');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// --- minimal CSV line parser that handles quoted fields with commas ---
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === ',') {
        fields.push(cur);
        cur = '';
      } else if (c === '"' && cur === '') {
        inQuotes = true;
      } else {
        cur += c;
      }
    }
  }
  fields.push(cur);
  return fields;
}

function toInt(v) {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toFloat(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log('\nBGG CSV Import');
  console.log('='.repeat(60));
  console.log(`Source:      ${csvPath}`);
  console.log(`Expansions:  ${includeExpansions ? 'included' : 'excluded'}`);
  if (Number.isFinite(limit)) console.log(`Limit:       ${limit} rows`);
  if (minRated > 0) console.log(`Min rated:   ${minRated} users`);
  console.log('='.repeat(60));

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let header = null;
  let colIdx = {};
  let totalRows = 0;
  let queued = 0;
  let skippedExpansions = 0;
  let skippedNoData = 0;
  let inserted = 0;
  let failed = 0;

  const BATCH_SIZE = 500;
  let batch = [];

  async function flush() {
    if (batch.length === 0) return;
    const payload = batch;
    batch = [];
    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(payload, { onConflict: 'bgg_id' });
    if (error) {
      console.error(`\n  upsert error (batch of ${payload.length}):`, error.message);
      failed += payload.length;
    } else {
      inserted += payload.length;
      process.stdout.write(`\r  upserted: ${inserted.toLocaleString()}   skipped: ${skippedExpansions + skippedNoData}   failed: ${failed}   `);
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (header === null) {
      header = parseCsvLine(line);
      header.forEach((h, i) => {
        colIdx[h.trim().toLowerCase()] = i;
      });
      const required = ['id', 'name', 'yearpublished', 'rank', 'average', 'usersrated', 'is_expansion'];
      for (const r of required) {
        if (colIdx[r] === undefined) {
          console.error(`Missing required column in CSV: ${r}`);
          process.exit(1);
        }
      }
      continue;
    }

    if (totalRows >= limit) break;
    totalRows++;

    const fields = parseCsvLine(line);
    const isExpansion = fields[colIdx.is_expansion] === '1';
    if (isExpansion && !includeExpansions) {
      skippedExpansions++;
      continue;
    }

    const bggId = toInt(fields[colIdx.id]);
    const name = fields[colIdx.name]?.trim();
    if (!bggId || !name) {
      skippedNoData++;
      continue;
    }

    const usersRated = toInt(fields[colIdx.usersrated]) || 0;
    if (usersRated < minRated) {
      skippedNoData++;
      continue;
    }

    const rank = toInt(fields[colIdx.rank]); // CSV uses 0 / blank for unranked
    const yearPublished = toInt(fields[colIdx.yearpublished]);
    const averageRating = toFloat(fields[colIdx.average]);

    batch.push({
      bgg_id: bggId,
      name,
      year_published: yearPublished,
      rank: rank,
      // rating column is DECIMAL(4,2); cap to two decimals
      rating: averageRating !== null ? Math.round(averageRating * 100) / 100 : null,
      last_synced_at: new Date().toISOString(),
    });
    queued++;

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }

  await flush();

  console.log('\n' + '='.repeat(60));
  console.log('Done.');
  console.log(`  CSV rows scanned:        ${totalRows.toLocaleString()}`);
  console.log(`  Skipped (expansions):    ${skippedExpansions.toLocaleString()}`);
  console.log(`  Skipped (no data/rating): ${skippedNoData.toLocaleString()}`);
  console.log(`  Queued for upsert:       ${queued.toLocaleString()}`);
  console.log(`  Successfully upserted:   ${inserted.toLocaleString()}`);
  console.log(`  Failed:                  ${failed.toLocaleString()}`);
  console.log('='.repeat(60) + '\n');

  if (queued > 0) {
    const { count, error } = await supabase
      .from('bgg_games_cache')
      .select('bgg_id', { count: 'exact', head: true });
    if (!error) {
      console.log(`Total rows now in bgg_games_cache: ${count?.toLocaleString()}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
