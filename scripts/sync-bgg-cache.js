#!/usr/bin/env node

/**
 * BGG Cache Sync Script
 * 
 * Run this script to populate/update your local BGG cache.
 * Can be run manually or via cron job.
 * 
 * Usage:
 *   node scripts/sync-bgg-cache.js                    # Sync top 25,000 games WITH rulebook URLs (slow, ~6–8 hr)
 *   node scripts/sync-bgg-cache.js --skip-rulebooks   # Sync top 25,000 games, no rulebook fetches (~1 hr)
 *   node scripts/sync-bgg-cache.js --limit 5000       # Sync top 5,000 games
 *   node scripts/sync-bgg-cache.js --resume           # Resume from last sync (skip already-cached IDs)
 *
 * Recommended first run:
 *   node scripts/sync-bgg-cache.js --limit 100 --skip-rulebooks
 *   (smoke test — confirms auth + DB wiring before committing to the long run)
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - BGG_API_TOKEN optional — if set, used for Authorization: Bearer
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const BATCH_SIZE = 20;
const RATE_LIMIT_MS = 2500; // 2.5 seconds - be more respectful
const DEFAULT_LIMIT = 25000;

// Parse command line args
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const GAME_LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : DEFAULT_LIMIT;
const RESUME_MODE = args.includes('--resume');
const SKIP_RULEBOOKS = args.includes('--skip-rulebooks');

// Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse XML helpers
function parseXMLValue(xml, tag) {
  const attrRegex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i');
  const attrMatch = xml.match(attrRegex);
  if (attrMatch) return attrMatch[1];
  
  const contentRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const contentMatch = xml.match(contentRegex);
  return contentMatch ? contentMatch[1].trim() : undefined;
}

function parseXMLLinks(xml, linkType) {
  const results = [];
  const regex = new RegExp(`<link[^>]*type="${linkType}"[^>]*value="([^"]*)"`, 'gi');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function decodeHTMLEntities(text) {
  if (!text) return '';
  return text
    .replace(/&#10;/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// BGG's HTML browse pages 403 anonymous non-browser UAs, so we mimic Chrome
// here. If BGG issues a Bearer token via their commercial-approval program,
// attach it too — it won't hurt the HTML pages and it authenticates the
// XML API calls.
function bggAuthHeaders() {
  const token = (process.env.BGG_API_TOKEN || '').trim();
  const base = {
    'Accept': 'application/xml, text/xml, text/html, */*',
    'User-Agent':
      process.env.BGG_USER_AGENT ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

// Fetch the highest-downloaded rulebook PDF URL from BGG's files endpoint.
// Returns null if none found or the request fails — the API route already
// falls back to the BGG files page and then a web search URL.
async function fetchRulebookUrl(bggId) {
  try {
    const res = await axios.get(`${BGG_API_BASE}/files?id=${bggId}`, {
      headers: bggAuthHeaders(),
      timeout: 15000,
    });
    const xml = res.data || '';
    if (typeof xml !== 'string' || xml.includes('<error>') || xml.includes('Rate limit')) {
      return null;
    }
    const fileRe = /<file\b[^>]*>([\s\S]*?)<\/file>/gi;
    let best = null;
    let m;
    while ((m = fileRe.exec(xml)) !== null) {
      const inner = m[1];
      const cat = inner.match(/<category[^>]*value="([^"]*)"/i);
      if (!cat || !cat[1].toLowerCase().includes('rule')) continue;
      const urlMatch = inner.match(/<url>([\s\S]*?)<\/url>/i);
      if (!urlMatch) continue;
      const dl = inner.match(/<downloads>(\d+)<\/downloads>/i);
      const downloads = dl ? parseInt(dl[1], 10) : 0;
      const url = urlMatch[1].trim();
      if (!url) continue;
      if (!best || downloads > best.downloads) best = { url, downloads };
    }
    return best ? best.url : null;
  } catch (err) {
    return null;
  }
}

// Fetch game details batch from BGG
async function fetchGameBatch(ids) {
  const url = `${BGG_API_BASE}/thing?id=${ids.join(',')}&stats=1`;

  const response = await axios.get(url, {
    headers: bggAuthHeaders(),
    timeout: 30000
  });
  
  const xml = response.data;
  const games = [];
  
  const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const bggId = parseInt(itemMatch[1]);
    const itemXml = itemMatch[2];
    
    const nameMatch = itemXml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/i);
    const name = nameMatch ? nameMatch[1] : 'Unknown Game';
    
    const rawDescription = parseXMLValue(itemXml, 'description');
    const description = rawDescription ? decodeHTMLEntities(rawDescription) : null;
    
    const image = parseXMLValue(itemXml, 'image') || null;
    const thumbnail = parseXMLValue(itemXml, 'thumbnail') || null;
    
    const minPlayers = parseXMLValue(itemXml, 'minplayers');
    const maxPlayers = parseXMLValue(itemXml, 'maxplayers');
    const playingTime = parseXMLValue(itemXml, 'playingtime');
    const minPlayingTime = parseXMLValue(itemXml, 'minplaytime');
    const maxPlayingTime = parseXMLValue(itemXml, 'maxplaytime');
    
    const ratingsXml = itemXml.match(/<ratings>([\s\S]*?)<\/ratings>/i)?.[1] || '';
    const rating = parseXMLValue(ratingsXml, 'average');
    const complexity = parseXMLValue(ratingsXml, 'averageweight');
    
    const rankMatch = ratingsXml.match(/<rank[^>]*type="subtype"[^>]*name="boardgame"[^>]*value="(\d+)"/i);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;
    
    const yearPublished = parseXMLValue(itemXml, 'yearpublished');
    
    const categories = parseXMLLinks(itemXml, 'boardgamecategory');
    const mechanics = parseXMLLinks(itemXml, 'boardgamemechanic');
    const designers = parseXMLLinks(itemXml, 'boardgamedesigner');
    const artists = parseXMLLinks(itemXml, 'boardgameartist');
    const publishers = parseXMLLinks(itemXml, 'boardgamepublisher');
    
    games.push({
      bgg_id: bggId,
      name,
      description,
      image,
      thumbnail,
      min_players: minPlayers ? parseInt(minPlayers) : null,
      max_players: maxPlayers ? parseInt(maxPlayers) : null,
      playing_time: playingTime ? parseInt(playingTime) : null,
      min_playing_time: minPlayingTime ? parseInt(minPlayingTime) : null,
      max_playing_time: maxPlayingTime ? parseInt(maxPlayingTime) : null,
      complexity: complexity ? parseFloat(complexity) : null,
      rating: rating ? parseFloat(rating) : null,
      year_published: yearPublished ? parseInt(yearPublished) : null,
      rank,
      categories,
      mechanics,
      designers,
      artists,
      publishers,
      rulebook_url: null,
      last_synced_at: new Date().toISOString(),
    });
  }
  
  return games;
}

// Fetch top game IDs from BGG browse pages
async function fetchTopGameIds(limit, startPage = 1) {
  const ids = [];
  const pageSize = 100;
  const pages = Math.ceil(limit / pageSize);
  
  console.log(`Fetching game IDs from BGG (${pages} pages)...`);
  
  for (let page = startPage; page <= pages + startPage - 1 && ids.length < limit; page++) {
    try {
      process.stdout.write(`  Page ${page}/${pages + startPage - 1}... `);
      
      const response = await axios.get(
        `https://boardgamegeek.com/browse/boardgame/page/${page}`,
        { headers: bggAuthHeaders() },
      );
      const html = response.data;
      
      const idRegex = /\/boardgame\/(\d+)\//g;
      let match;
      const pageIds = new Set();
      
      while ((match = idRegex.exec(html)) !== null) {
        pageIds.add(parseInt(match[1]));
      }
      
      for (const id of pageIds) {
        if (ids.length < limit && !ids.includes(id)) {
          ids.push(id);
        }
      }
      
      console.log(`found ${pageIds.size} IDs (total: ${ids.length})`);
      await sleep(RATE_LIMIT_MS);
    } catch (error) {
      console.error(`\n  Error on page ${page}: ${error.message}`);
    }
  }
  
  return ids;
}

// Get already synced game IDs
async function getSyncedGameIds() {
  const { data, error } = await supabase
    .from('bgg_games_cache')
    .select('bgg_id');
  
  if (error) {
    console.error('Error fetching synced IDs:', error);
    return new Set();
  }
  
  return new Set(data.map(g => g.bgg_id));
}

// Main sync function
async function syncBGGCache() {
  console.log('\n🎲 BGG Cache Sync');
  console.log('='.repeat(50));
  console.log(`Target: ${GAME_LIMIT.toLocaleString()} games`);
  console.log(`Mode: ${RESUME_MODE ? 'Resume (skip existing)' : 'Full sync'}`);
  console.log(`Rulebook URLs: ${SKIP_RULEBOOKS ? 'SKIPPED (fast)' : 'included (slow)'}`);
  console.log(`BGG auth: ${process.env.BGG_API_TOKEN ? 'token' : 'anonymous'}`);
  console.log('='.repeat(50));
  
  // Create sync log
  const { data: syncLog, error: logError } = await supabase
    .from('bgg_sync_log')
    .insert({ 
      status: 'running', 
      details: { limit: GAME_LIMIT, resume: RESUME_MODE } 
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Failed to create sync log:', logError);
    return;
  }
  
  const syncId = syncLog.id;
  let gamesSynced = 0;
  let gamesFailed = 0;
  let gamesSkipped = 0;
  
  try {
    // Get existing game IDs if resuming
    let existingIds = new Set();
    if (RESUME_MODE) {
      console.log('\nChecking existing games in cache...');
      existingIds = await getSyncedGameIds();
      console.log(`Found ${existingIds.size} games already cached\n`);
    }
    
    // Fetch game IDs from BGG
    const gameIds = await fetchTopGameIds(GAME_LIMIT);
    console.log(`\nTotal unique game IDs: ${gameIds.length}`);
    
    // Filter out already synced if resuming
    const idsToSync = RESUME_MODE 
      ? gameIds.filter(id => !existingIds.has(id))
      : gameIds;
    
    if (RESUME_MODE) {
      gamesSkipped = gameIds.length - idsToSync.length;
      console.log(`Skipping ${gamesSkipped} already cached games`);
    }
    
    console.log(`Games to sync: ${idsToSync.length}\n`);
    
    if (idsToSync.length === 0) {
      console.log('✅ Nothing to sync - cache is up to date!');
      await supabase
        .from('bgg_sync_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          games_synced: 0,
          games_failed: 0,
          details: { limit: GAME_LIMIT, skipped: gamesSkipped, message: 'Already up to date' }
        })
        .eq('id', syncId);
      return;
    }
    
    // Process in batches
    const totalBatches = Math.ceil(idsToSync.length / BATCH_SIZE);
    const startTime = Date.now();
    
    for (let i = 0; i < idsToSync.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const batchIds = idsToSync.slice(i, i + BATCH_SIZE);
      
      // Estimate time remaining
      const elapsed = (Date.now() - startTime) / 1000;
      const gamesPerSec = gamesSynced / elapsed || 0;
      const remaining = idsToSync.length - i;
      const etaMinutes = Math.ceil(remaining / gamesPerSec / 60) || '?';
      
      process.stdout.write(
        `\rBatch ${batchNum}/${totalBatches} | ` +
        `Synced: ${gamesSynced} | ` +
        `Failed: ${gamesFailed} | ` +
        `ETA: ${etaMinutes} min   `
      );
      
      try {
        const games = await fetchGameBatch(batchIds);

        for (const game of games) {
          // Fetch rulebook URL per game (separate BGG endpoint). Small sleep
          // between file fetches keeps us well under BGG's rate threshold.
          // Skip entirely with --skip-rulebooks to cut runtime ~6x.
          if (!SKIP_RULEBOOKS) {
            const rulebookUrl = await fetchRulebookUrl(game.bgg_id);
            if (rulebookUrl) game.rulebook_url = rulebookUrl;
            await sleep(400);
          }

          const { error } = await supabase
            .from('bgg_games_cache')
            .upsert(game, { onConflict: 'bgg_id' });

          if (error) {
            gamesFailed++;
          } else {
            gamesSynced++;
          }
        }

        // Rate limit between thing batches
        await sleep(RATE_LIMIT_MS);

      } catch (error) {
        console.error(`\nBatch error: ${error.message}`);
        if (error.response) {
          console.error(`  Status: ${error.response.status}`);
          console.error(`  URL: ${BGG_API_BASE}/thing?id=${batchIds.slice(0, 3).join(',')}...`);
        }
        gamesFailed += batchIds.length;
      }
      
      // Update sync log every 50 batches
      if (batchNum % 50 === 0) {
        await supabase
          .from('bgg_sync_log')
          .update({
            games_synced: gamesSynced,
            games_failed: gamesFailed,
            details: { 
              limit: GAME_LIMIT, 
              progress: `${i + BATCH_SIZE}/${idsToSync.length}`,
              skipped: gamesSkipped
            }
          })
          .eq('id', syncId);
      }
    }
    
    console.log('\n');
    
    // Complete sync log
    await supabase
      .from('bgg_sync_log')
      .update({
        status: gamesFailed > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        games_synced: gamesSynced,
        games_failed: gamesFailed,
        details: { limit: GAME_LIMIT, skipped: gamesSkipped }
      })
      .eq('id', syncId);
    
    const duration = Math.round((Date.now() - startTime) / 1000 / 60);
    
    console.log('='.repeat(50));
    console.log('✅ Sync Complete!');
    console.log(`   Games synced: ${gamesSynced.toLocaleString()}`);
    console.log(`   Games failed: ${gamesFailed.toLocaleString()}`);
    console.log(`   Games skipped: ${gamesSkipped.toLocaleString()}`);
    console.log(`   Duration: ${duration} minutes`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n\n❌ Sync failed:', error);
    
    await supabase
      .from('bgg_sync_log')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        games_synced: gamesSynced,
        games_failed: gamesFailed,
        error_message: error.message,
      })
      .eq('id', syncId);
  }
}

// Run sync
syncBGGCache();
