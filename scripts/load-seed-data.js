#!/usr/bin/env node

/**
 * Load Seed Data into BGG Cache
 * Uses the existing seed_games.json to populate the cache
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase client
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

async function loadSeedData() {
  console.log('\n🎲 Loading Seed Data into BGG Cache');
  console.log('='.repeat(50));
  
  // Read all seed files
  const seedFiles = [
    'seed_games.json',
    'seed_strategy.json',
    'seed_party.json',
    'seed_family.json',
    'seed_drinking.json'
  ];
  
  const allGames = new Map(); // Use Map to dedupe by bgg_id
  
  for (const file of seedFiles) {
    const filePath = path.join(__dirname, '..', 'src', 'data', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }
    
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Handle different data formats
    let data = rawData;
    if (rawData.games && Array.isArray(rawData.games)) {
      data = rawData.games; // Handle {games: [...]} format
    } else if (!Array.isArray(rawData)) {
      console.log(`Skipping ${file} (invalid format)`);
      continue;
    }
    
    console.log(`Loaded ${data.length} games from ${file}`);
    
    for (const game of data) {
      const bggId = parseInt(game.id);
      
      // Only add if not already in map (dedupe)
      if (!allGames.has(bggId)) {
        allGames.set(bggId, {
          bgg_id: bggId,
          name: game.name || 'Unknown Game',
          description: game.description || null,
          image: game.image || null,
          thumbnail: game.thumbnail || null,
          min_players: game.minPlayers ? parseInt(game.minPlayers) : null,
          max_players: game.maxPlayers ? parseInt(game.maxPlayers) : null,
          playing_time: game.playingTime ? parseInt(game.playingTime) : null,
          min_playing_time: null,
          max_playing_time: null,
          complexity: game.weight ? parseFloat(game.weight) : null,
          rating: game.rating ? parseFloat(game.rating) : null,
          year_published: game.yearPublished ? parseInt(game.yearPublished) : null,
          rank: game.rank ? parseInt(game.rank) : null,
          categories: game.categories || [],
          mechanics: game.mechanics || [],
          designers: game.designers || [],
          artists: [],
          publishers: [],
          last_synced_at: new Date().toISOString(),
        });
      }
    }
  }
  
  console.log(`\nTotal unique games: ${allGames.size}`);
  console.log('Inserting into database...\n');
  
  // Create sync log
  const { data: syncLog, error: logError } = await supabase
    .from('bgg_sync_log')
    .insert({ 
      status: 'running', 
      details: { source: 'seed_data', games: allGames.size } 
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
  
  // Insert in batches of 100
  const games = Array.from(allGames.values());
  const batchSize = 100;
  
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('bgg_games_cache')
      .upsert(batch, { onConflict: 'bgg_id' });
    
    if (error) {
      console.error(`Batch error at ${i}:`, error.message);
      gamesFailed += batch.length;
    } else {
      gamesSynced += batch.length;
      process.stdout.write(`\rInserted: ${gamesSynced}/${games.length}   `);
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
  
  console.log('\n\n' + '='.repeat(50));
  console.log('✅ Seed Data Loaded!');
  console.log(`   Games inserted: ${gamesSynced}`);
  console.log(`   Games failed: ${gamesFailed}`);
  console.log('='.repeat(50));
}

loadSeedData().catch(console.error);
