// Supabase Edge Function: BGG Sync
// Fetches top 25,000 games from BoardGameGeek and caches locally
// Runs daily at 3 AM via pg_cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BGG_API_BASE = 'https://www.boardgamegeek.com/xmlapi2';
const BATCH_SIZE = 20; // BGG allows up to 20 IDs per request
const RATE_LIMIT_MS = 1100; // 1.1 seconds between requests to respect BGG rate limits

interface BGGGame {
  bgg_id: number;
  name: string;
  description: string | null;
  image: string | null;
  thumbnail: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  min_playing_time: number | null;
  max_playing_time: number | null;
  complexity: number | null;
  rating: number | null;
  year_published: number | null;
  rank: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  artists: string[];
  publishers: string[];
}

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Parse XML helper functions
function parseXMLAttribute(xml: string, tag: string, attr: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : undefined;
}

function parseXMLValue(xml: string, tag: string): string | undefined {
  // Try attribute "value" first (common in BGG XML)
  const attrRegex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i');
  const attrMatch = xml.match(attrRegex);
  if (attrMatch) return attrMatch[1];
  
  // Fall back to tag content
  const contentRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const contentMatch = xml.match(contentRegex);
  return contentMatch ? contentMatch[1].trim() : undefined;
}

function parseXMLLinks(xml: string, linkType: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<link[^>]*type="${linkType}"[^>]*value="([^"]*)"`, 'gi');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function decodeHTMLEntities(text: string): string {
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

// Fetch game details from BGG for a batch of IDs
async function fetchGameBatch(ids: number[]): Promise<BGGGame[]> {
  const url = `${BGG_API_BASE}/thing?id=${ids.join(',')}&stats=1`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/xml' }
  });
  
  if (!response.ok) {
    throw new Error(`BGG API error: ${response.status}`);
  }
  
  const xml = await response.text();
  const games: BGGGame[] = [];
  
  // Parse each item in the response
  const itemRegex = /<item[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const bggId = parseInt(itemMatch[1]);
    const itemXml = itemMatch[2];
    
    // Get primary name
    const nameMatch = itemXml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/i);
    const name = nameMatch ? nameMatch[1] : 'Unknown Game';
    
    // Parse description
    const rawDescription = parseXMLValue(itemXml, 'description');
    const description = rawDescription ? decodeHTMLEntities(rawDescription) : null;
    
    // Parse images
    const image = parseXMLValue(itemXml, 'image') || null;
    const thumbnail = parseXMLValue(itemXml, 'thumbnail') || null;
    
    // Parse player counts
    const minPlayers = parseXMLValue(itemXml, 'minplayers');
    const maxPlayers = parseXMLValue(itemXml, 'maxplayers');
    
    // Parse play times
    const playingTime = parseXMLValue(itemXml, 'playingtime');
    const minPlayingTime = parseXMLValue(itemXml, 'minplaytime');
    const maxPlayingTime = parseXMLValue(itemXml, 'maxplaytime');
    
    // Parse ratings and complexity from statistics
    const ratingsXml = itemXml.match(/<ratings>([\s\S]*?)<\/ratings>/i)?.[1] || '';
    const rating = parseXMLValue(ratingsXml, 'average');
    const complexity = parseXMLValue(ratingsXml, 'averageweight');
    
    // Parse rank
    const rankMatch = ratingsXml.match(/<rank[^>]*type="subtype"[^>]*name="boardgame"[^>]*value="(\d+)"/i);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;
    
    // Parse year
    const yearPublished = parseXMLValue(itemXml, 'yearpublished');
    
    // Parse links (categories, mechanics, etc.)
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
    });
  }
  
  return games;
}

// Fetch top game IDs from BGG rankings
async function fetchTopGameIds(limit: number = 25000): Promise<number[]> {
  const ids: number[] = [];
  const pageSize = 100;
  const pages = Math.ceil(limit / pageSize);
  
  for (let page = 1; page <= pages && ids.length < limit; page++) {
    const url = `https://boardgamegeek.com/browse/boardgame/page/${page}`;
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract game IDs from the HTML
      const idRegex = /\/boardgame\/(\d+)\//g;
      let match;
      const pageIds = new Set<number>();
      
      while ((match = idRegex.exec(html)) !== null) {
        pageIds.add(parseInt(match[1]));
      }
      
      for (const id of pageIds) {
        if (ids.length < limit) {
          ids.push(id);
        }
      }
      
      // Rate limit
      await sleep(RATE_LIMIT_MS);
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
    }
  }
  
  return ids;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get parameters from request
    const { limit = 25000, startRank = 1 } = await req.json().catch(() => ({}));
    
    // Create Supabase client with service role for write access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('bgg_sync_log')
      .insert({ status: 'running', details: { limit, startRank } })
      .select()
      .single();
    
    if (logError) {
      throw new Error(`Failed to create sync log: ${logError.message}`);
    }
    
    const syncId = syncLog.id;
    let gamesSynced = 0;
    let gamesFailed = 0;
    
    console.log(`Starting BGG sync: ${limit} games from rank ${startRank}`);
    
    // Fetch top game IDs
    console.log('Fetching top game IDs from BGG rankings...');
    const gameIds = await fetchTopGameIds(limit);
    console.log(`Found ${gameIds.length} game IDs`);
    
    // Process in batches
    for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
      const batchIds = gameIds.slice(i, i + BATCH_SIZE);
      
      try {
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(gameIds.length / BATCH_SIZE)}`);
        
        const games = await fetchGameBatch(batchIds);
        
        // Upsert games to database
        for (const game of games) {
          const { error } = await supabase
            .from('bgg_games_cache')
            .upsert({
              ...game,
              last_synced_at: new Date().toISOString(),
            }, { onConflict: 'bgg_id' });
          
          if (error) {
            console.error(`Failed to upsert game ${game.bgg_id}:`, error);
            gamesFailed++;
          } else {
            gamesSynced++;
          }
        }
        
        // Update sync log progress periodically
        if (i % 500 === 0) {
          await supabase
            .from('bgg_sync_log')
            .update({ 
              games_synced: gamesSynced, 
              games_failed: gamesFailed,
              details: { limit, startRank, progress: `${i + BATCH_SIZE}/${gameIds.length}` }
            })
            .eq('id', syncId);
        }
        
        // Rate limit between batches
        await sleep(RATE_LIMIT_MS);
        
      } catch (error) {
        console.error(`Batch error at index ${i}:`, error);
        gamesFailed += batchIds.length;
      }
    }
    
    // Complete sync log
    await supabase
      .from('bgg_sync_log')
      .update({
        status: gamesFailed > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        games_synced: gamesSynced,
        games_failed: gamesFailed,
      })
      .eq('id', syncId);
    
    console.log(`Sync complete: ${gamesSynced} synced, ${gamesFailed} failed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        syncId,
        gamesSynced,
        gamesFailed,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Sync error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
