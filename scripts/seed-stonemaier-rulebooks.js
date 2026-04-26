#!/usr/bin/env node

/**
 * Stonemaier Rulebook Seeding Helper
 *
 * Walks the local Stonemaier Dropbox snapshot under
 * `/game rulebooks/Rules and Other Public Files/`, identifies the most
 * likely English rulebook PDF per game folder, resolves the BGG ID via
 * the BGG XML API (using BGG_API_TOKEN), and prints TypeScript entries
 * ready to paste into `lib/ai/rulebook_overrides.ts`.
 *
 * This is a one-shot helper, not part of the pre-warm pipeline.
 *
 * Usage:
 *   node scripts/seed-stonemaier-rulebooks.js
 *
 * Optional:
 *   --root <path>   Override the rulebook folder root.
 *   --skip 167791,316554   Comma-separated bggIds to skip (already seeded).
 *
 * Output:
 *   - TypeScript object literal entries on stdout (paste into the override map)
 *   - Diagnostics on stderr (folders skipped, ambiguous matches, big files)
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.join(
  process.cwd(),
  'game rulebooks',
  'Rules and Other Public Files',
);

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const ROOT = rootIndex !== -1 ? args[rootIndex + 1] : DEFAULT_ROOT;
const skipIndex = args.indexOf('--skip');
const SKIP_IDS = new Set(
  skipIndex !== -1
    ? args[skipIndex + 1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter(Boolean)
    : [],
);

// Folders that aren't games.
const NON_GAME_FOLDERS = new Set([
  'Card Frames',
  'Other Files',
  'Third Party Accessories',
  'Various Assets',
]);

const FIFTY_MB = 50 * 1024 * 1024;
const TOKEN = (process.env.BGG_API_TOKEN || '').trim();

function log(msg) {
  process.stderr.write(`${msg}\n`);
}

function listPdfs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('._') && /\.pdf$/i.test(f))
    .map((f) => path.join(dir, f));
}

function listSubdirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('._'))
    .map((d) => d.name);
}

// Non-English language suffixes; English is desired and never filtered.
const LANGUAGE_SUFFIXES = [
  'Spanish', 'French', 'German', 'Italian', 'Polish', 'Dutch',
  'Czech', 'Hungarian', 'Brazilian-Portuguese', 'Portuguese', 'Russian',
  'Bulgarian', 'Chinese', 'Croatian', 'Romanian', 'Thai', 'Turkish',
  'Ukrainian', 'Japanese', 'Korean', 'Norwegian', 'Swedish', 'Danish',
  'Finnish', 'Greek', 'Hebrew', 'Slovenian', 'Slovak',
];

function languageOf(filename) {
  for (const lang of LANGUAGE_SUFFIXES) {
    if (filename.includes(`- ${lang}`) || filename.includes(`-${lang}`)) return lang;
  }
  // 2-letter language codes embedded with various separators (`_ES_`,
  // ` ES.pdf`, `-DE.pdf`, etc.). Include space and dash separators.
  if (/[\s_-](NL|FR|DE|ES|IT|PL|RU|JP|KR|CN|TR|HU|CZ|GR|HE|FI|SE|NO|DK|RO|BR|PT|UA|PTBR|ITA)[\s._-]/i.test(filename)) {
    return 'lang-code';
  }
  if (/[\s_-](NL|FR|DE|ES|IT|PL|RU|JP|KR|CN|TR|HU|CZ|GR|HE|FI|SE|NO|DK|RO|BR|PT|UA|PTBR|ITA)\.pdf$/i.test(filename)) {
    return 'lang-code-tail';
  }
  return null;
}

// Filenames containing any of these are NOT the main rulebook. We don't
// use \b — Stonemaier uses _ as separators which is a word char in JS
// regex, so \b won't fire. Loose substring match is fine; false positives
// here only mean we skip ambiguous files (better than picking expansion
// or solo-variant rulebooks).
const NEGATIVE_PATTERNS = [
  /Automa/i,         // "Automa" or anywhere it appears
  /_Auto[A-Z]/,      // "_AutoRulebook" Stonemaier shorthand for Automa
  /^Auto[A-Z]/,      // "AutoRulebook" at filename start
  /Expansion/i,
  /[A-Za-z]Exp[_A-Z]/,  // "EuphExp_..." — Exp inside concat token
  /Promo/i,
  /Achievement/i,
  /Appendix/i,
  /Reference/i,
  /Score(pad|sheet|card)/i,
  /Teaching/i,
  /Bonus/i,
  /Cards/i,
  /Update Pack/i,
  /SwiftStart/i,
  /PlayerGuide/i,
  /TeachGuide/i,
  /Shadow Empire/i,  // Tapestry expansion
  /Arts.*Architecture/i,
  /Dragon Academy/i,
  /Crossroads.*Matsuri/i,
  /Chronicle/i,      // Charterstone Chronicle — campaign-only mode
];

// Positive: must contain Rulebook/Rules as a meaningful token.
// We don't use \b because filenames use _ as separators (e.g.
// "WS_Rulebook_r24.pdf") — _ is a word char in regex, so \b doesn't fire.
function isRulebookCandidate(filename) {
  if (!/(Rulebook|Rules)/i.test(filename)) return false;
  for (const neg of NEGATIVE_PATTERNS) {
    if (neg.test(filename)) return false;
  }
  if (languageOf(filename)) return false;
  return true;
}

/**
 * Pick the best English rulebook PDF in a game folder.
 * Returns { absPath, relPath, bytes, source } or null.
 */
function pickRulebook(gameDir) {
  // 1. Rulebook (many languages)/<Game> - English.pdf
  const langDir = path.join(gameDir, 'Rulebook (many languages)');
  if (fs.existsSync(langDir)) {
    const pdfs = listPdfs(langDir);
    const english = pdfs.find((p) => /-\s*English\.pdf$/i.test(p));
    if (english) return shape(english, 'english-suffix');
    // Stonemaier convention: the unsuffixed file is the original English.
    const unsuffixed = pdfs.find((p) => {
      const base = path.basename(p);
      return !languageOf(base);
    });
    if (unsuffixed) return shape(unsuffixed, 'unsuffixed');
  }

  // 2. Complete Rulebook/<file>.pdf
  const completeDir = path.join(gameDir, 'Complete Rulebook');
  if (fs.existsSync(completeDir)) {
    const pdfs = listPdfs(completeDir);
    if (pdfs.length === 1) return shape(pdfs[0], 'complete-rulebook');
    if (pdfs.length > 1) {
      const color = pdfs.find((p) => !/-BW\.pdf$/i.test(p)) || pdfs[0];
      return shape(color, 'complete-rulebook');
    }
  }

  // 3. Root *Rulebook*.pdf or *Rules*.pdf, filtered against negative patterns.
  const rootPdfs = listPdfs(gameDir);
  const candidates = rootPdfs.filter((p) =>
    isRulebookCandidate(path.basename(p)),
  );
  if (candidates.length > 0) {
    // Prefer ones with "Rulebook" over "Rules" (less ambiguous), then
    // shortest filename (usually the cleanest base-game file).
    candidates.sort((a, b) => {
      const aBook = /Rulebook/i.test(path.basename(a)) ? 0 : 1;
      const bBook = /Rulebook/i.test(path.basename(b)) ? 0 : 1;
      if (aBook !== bBook) return aBook - bBook;
      return path.basename(a).length - path.basename(b).length;
    });
    return shape(candidates[0], 'root-rulebook');
  }

  return null;
}

function shape(absPath, source) {
  const stat = fs.statSync(absPath);
  return {
    absPath,
    relPath: path.relative(process.cwd(), absPath),
    bytes: stat.size,
    source,
  };
}

async function searchBgg(query) {
  if (!TOKEN) {
    log('!!! BGG_API_TOKEN not set. Cannot resolve bggIds.');
    return [];
  }
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
    query,
  )}&type=boardgame&exact=1`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'User-Agent': 'TheTome/1.0',
      },
    });
  } catch (err) {
    log(`  BGG search failed for "${query}": ${err.message}`);
    return [];
  }
  if (!res.ok) {
    log(`  BGG search HTTP ${res.status} for "${query}"`);
    return [];
  }
  const xml = await res.text();
  const items = [...xml.matchAll(/<item\s+type="boardgame"\s+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi)];
  if (items.length === 0 && url.includes('exact=1')) {
    // Retry as fuzzy
    return searchBggFuzzy(query);
  }
  return items.map(parseBggItem);
}

async function searchBggFuzzy(query) {
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
    query,
  )}&type=boardgame`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'TheTome/1.0' },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return [
    ...xml.matchAll(
      /<item\s+type="boardgame"\s+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi,
    ),
  ].map(parseBggItem);
}

function parseBggItem(m) {
  const id = parseInt(m[1], 10);
  const inner = m[2];
  const primary = inner.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/i);
  const any = inner.match(/<name[^>]*value="([^"]*)"/i);
  const yearMatch = inner.match(/<yearpublished[^>]*value="(\d+)"/i);
  return {
    id,
    name: primary ? primary[1] : any ? any[1] : null,
    year: yearMatch ? parseInt(yearMatch[1], 10) : null,
  };
}

function pickBestMatch(items, folderName) {
  if (items.length === 0) return null;
  // Stonemaier's first game (Viticulture) shipped 2013. Filter out older
  // unrelated games sharing a name (e.g., a 2005 "Tapestry" board game vs
  // Stonemaier's 2019 Tapestry).
  const stonemaierEra = items.filter((it) => (it.year ?? 0) >= 2012);
  const pool = stonemaierEra.length > 0 ? stonemaierEra : items;
  // Prefer the oldest within the Stonemaier era (the BASE game, not an
  // expansion). Promo cards / expansions show up later.
  const sorted = [...pool].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  return sorted[0];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(ROOT)) {
    log(`ROOT does not exist: ${ROOT}`);
    process.exit(1);
  }

  log(`Scanning ${ROOT}...`);
  log(`BGG token: ${TOKEN ? 'present' : 'MISSING — run will fail'}`);
  log(`Skipping bggIds: ${[...SKIP_IDS].join(', ') || 'none'}`);
  log('');

  const folders = listSubdirs(ROOT)
    .filter((name) => !NON_GAME_FOLDERS.has(name))
    .sort();

  log(`Found ${folders.length} candidate game folders.`);
  log('');

  const results = [];
  const ambiguous = [];
  const missing = [];
  const oversize = [];

  for (const folder of folders) {
    const gameDir = path.join(ROOT, folder);
    const pdf = pickRulebook(gameDir);
    if (!pdf) {
      missing.push(folder);
      log(`  - SKIP (no English rulebook found): ${folder}`);
      continue;
    }
    log(
      `  - ${folder}: ${path.basename(pdf.absPath)} (${(
        pdf.bytes / 1024 / 1024
      ).toFixed(1)} MB, ${pdf.source})`,
    );
    if (pdf.bytes > FIFTY_MB) {
      oversize.push({ folder, mb: (pdf.bytes / 1024 / 1024).toFixed(1) });
    }

    const hits = await searchBgg(folder);
    if (hits.length === 0) {
      ambiguous.push({ folder, reason: 'no_bgg_match' });
      log(`      ! No BGG match. Skipping.`);
      await sleep(400);
      continue;
    }
    const best = pickBestMatch(hits, folder);
    if (SKIP_IDS.has(best.id)) {
      log(`      = bggId ${best.id} already seeded. Skipping.`);
      await sleep(400);
      continue;
    }
    if (hits.length > 1) {
      ambiguous.push({
        folder,
        reason: `${hits.length} hits — picked ${best.name} (${best.id}, ${best.year})`,
      });
    }
    results.push({
      bggId: best.id,
      bggName: best.name,
      year: best.year,
      folder,
      relPath: pdf.relPath,
      bytes: pdf.bytes,
      hitCount: hits.length,
    });

    await sleep(400); // be polite to BGG
  }

  log('');
  log('--- Summary ---');
  log(`Successfully resolved: ${results.length}`);
  log(`Ambiguous (review): ${ambiguous.length}`);
  log(`Missing English PDF: ${missing.length}`);
  log(`Files >50 MB (Storage rehost will fail): ${oversize.length}`);
  if (ambiguous.length > 0) {
    log('');
    log('Ambiguous:');
    for (const a of ambiguous) log(`  - ${a.folder}: ${a.reason}`);
  }
  if (oversize.length > 0) {
    log('');
    log('Oversize (wizard works, button falls back to BGG):');
    for (const o of oversize) log(`  - ${o.folder} (${o.mb} MB)`);
  }
  if (missing.length > 0) {
    log('');
    log('Missing English PDF — needs manual handling:');
    for (const m of missing) log(`  - ${m}`);
  }
  log('');
  log(
    '--- Paste these entries into lib/ai/rulebook_overrides.ts (review names!) ---',
  );
  log('');

  // Print TS entries to stdout (so > redirects work)
  for (const r of results) {
    process.stdout.write(
      `  // ${r.folder} → BGG: ${r.bggName} (${r.year}${r.hitCount > 1 ? `, ${r.hitCount} hits — verify!` : ''})\n`,
    );
    process.stdout.write(
      `  ${r.bggId}: { filePath: '${r.relPath.replace(/\\/g, '/')}', note: 'Stonemaier — ${r.bggName}' },\n`,
    );
  }
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
