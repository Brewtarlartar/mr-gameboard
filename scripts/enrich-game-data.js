/**
 * BoardGameGeek Data Enricher
 * Fetches detailed metadata for all category files using HTML scraping
 * 
 * Processes:
 * - seed_games.json (Overall Top 500)
 * - seed_party.json (Party Games Top 100)
 * - seed_strategy.json (Strategy Games Top 100)
 * - seed_family.json (Family Games Top 100)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const DELAY_MS = 1500; // 1.5 seconds between requests
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const PROGRESS_FILE = path.join(__dirname, 'enrich_progress.json');

// Files to process
const CATEGORY_FILES = [
  'seed_games.json',
  'seed_party.json',
  'seed_strategy.json',
  'seed_family.json'
];

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Load progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { processedIds: [], currentFile: null, currentIndex: 0 };
}

// Helper: Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Fetch game details from BGG page
async function fetchGameDetails(gameId, gameName) {
  const url = `https://boardgamegeek.com/boardgame/${gameId}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Try to find the JSON-LD data or embedded data
    let gameData = {};
    
    // Look for script tags with game data
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      
      // Look for GEEK.geekitemPreload
      if (content.includes('GEEK.geekitemPreload')) {
        const match = content.match(/GEEK\.geekitemPreload\s*=\s*({[\s\S]*?});/);
        if (match) {
          try {
            const preload = JSON.parse(match[1]);
            if (preload.item) {
              gameData = preload.item;
            }
          } catch (e) {}
        }
      }
    });

    // Extract data from the parsed JSON or fallback to HTML scraping
    const result = {
      description: '',
      minPlayers: null,
      maxPlayers: null,
      playingTime: null,
      yearPublished: null,
      rating: null,
      weight: null,
      image: null,
      thumbnail: null,
      categories: [],
      mechanics: [],
      designers: []
    };

    // If we got JSON data
    if (gameData && Object.keys(gameData).length > 0) {
      result.description = gameData.description || '';
      result.minPlayers = gameData.minplayers || null;
      result.maxPlayers = gameData.maxplayers || null;
      result.playingTime = gameData.playingtime || gameData.maxplaytime || null;
      result.yearPublished = gameData.yearpublished || null;
      
      // Get image URLs
      if (gameData.images) {
        result.image = gameData.images.original || gameData.images.square200 || null;
        result.thumbnail = gameData.images.thumb || gameData.images.square100 || null;
      }
      
      // Get rating
      if (gameData.stats && gameData.stats.average) {
        result.rating = parseFloat(gameData.stats.average).toFixed(1);
      }
      
      // Get weight/complexity
      if (gameData.stats && gameData.stats.avgweight) {
        result.weight = parseFloat(gameData.stats.avgweight).toFixed(2);
      }

      // Get categories, mechanics, designers from links
      if (gameData.links) {
        result.categories = (gameData.links.boardgamecategory || []).map(c => c.name);
        result.mechanics = (gameData.links.boardgamemechanic || []).map(m => m.name);
        result.designers = (gameData.links.boardgamedesigner || []).map(d => d.name);
      }
    }
    
    // Fallback: Try to get image from meta tags
    if (!result.image) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        result.image = ogImage;
      }
    }
    
    // Fallback: Try to get description from meta tags
    if (!result.description) {
      const ogDesc = $('meta[property="og:description"]').attr('content');
      if (ogDesc) {
        result.description = ogDesc;
      }
    }

    return result;
  } catch (err) {
    console.log(`   ⚠️ Error fetching details: ${err.message}`);
    return null;
  }
}

// Process a single category file
async function processFile(filename, progress) {
  const filePath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ File not found: ${filename}`);
    return;
  }
  
  console.log(`\n📁 Processing: ${filename}`);
  
  const games = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let enrichedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const gameKey = `${filename}:${game.id}`;
    
    // Skip if already processed
    if (progress.processedIds.includes(gameKey)) {
      skippedCount++;
      continue;
    }
    
    console.log(`[${i + 1}/${games.length}] Fetching: ${game.name} (ID: ${game.id})...`);
    
    const details = await fetchGameDetails(game.id, game.name);
    
    if (details) {
      // Merge details into game object
      games[i] = {
        ...game,
        description: details.description || game.description || '',
        minPlayers: details.minPlayers || game.minPlayers,
        maxPlayers: details.maxPlayers || game.maxPlayers,
        playingTime: details.playingTime || game.playingTime,
        yearPublished: details.yearPublished || game.yearPublished,
        rating: details.rating || game.rating,
        weight: details.weight || game.weight,
        image: details.image || game.image,
        thumbnail: details.thumbnail || game.thumbnail,
        categories: details.categories.length > 0 ? details.categories : (game.categories || []),
        mechanics: details.mechanics.length > 0 ? details.mechanics : (game.mechanics || []),
        designers: details.designers.length > 0 ? details.designers : (game.designers || [])
      };
      
      const hasImage = details.image ? '✓ Image' : '✗ No Image';
      const rating = details.rating || 'N/A';
      const year = details.yearPublished || 'N/A';
      console.log(`   ${hasImage} | ${rating}★ | ${year}`);
      
      enrichedCount++;
    } else {
      console.log(`   ✗ Failed to fetch details`);
    }
    
    // Mark as processed
    progress.processedIds.push(gameKey);
    
    // Save progress every 10 games
    if ((enrichedCount + skippedCount) % 10 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
      saveProgress(progress);
      console.log(`   💾 Progress saved (${enrichedCount} enriched, ${skippedCount} skipped)`);
    }
    
    // Delay between requests
    await sleep(DELAY_MS);
  }
  
  // Final save for this file
  fs.writeFileSync(filePath, JSON.stringify(games, null, 2));
  saveProgress(progress);
  
  console.log(`\n   ✅ ${filename} complete: ${enrichedCount} enriched, ${skippedCount} skipped`);
}

// Main execution
async function main() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🎲 BOARDGAMEGEEK DATA ENRICHER (Multi-Category)');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`⏱️ Delay between requests: ${DELAY_MS}ms`);
  
  // Load progress
  let progress = loadProgress();
  console.log(`\n📊 Resume Status: ${progress.processedIds.length} games already processed`);
  
  // Check which files exist
  console.log('\n📋 Files to process:');
  for (const file of CATEGORY_FILES) {
    const filePath = path.join(DATA_DIR, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✓' : '✗';
    if (exists) {
      const games = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`   ${status} ${file} (${games.length} games)`);
    } else {
      console.log(`   ${status} ${file} (not found)`);
    }
  }
  
  // Process each file
  for (const file of CATEGORY_FILES) {
    await processFile(file, progress);
  }
  
  // Cleanup progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
  
  // Summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✅ ENRICHMENT COMPLETE');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`📅 Completed: ${new Date().toLocaleString()}`);
  console.log('\n📊 Final counts:');
  for (const file of CATEGORY_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      const games = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const withImages = games.filter(g => g.image).length;
      console.log(`   ${file}: ${games.length} games (${withImages} with images)`);
    }
  }
}

main().catch(console.error);
