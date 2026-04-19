/**
 * BoardGameGeek Category Scraper
 * Fetches Top 500 games (Overall) and Top 100 from other BGG categories
 * 
 * Uses the correct BGG subdomain URLs for category rankings
 * Pagination: /page/2, /page/3, etc.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const DELAY_MS = 2000; // 2 seconds between requests
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');

// Category definitions with correct BGG URLs
const CATEGORIES = [
  {
    name: 'Overall',
    url: 'https://boardgamegeek.com/browse/boardgame',
    outputFile: 'seed_games.json',
    pages: 5  // 5 pages x 100 games = Top 500
  },
  {
    name: 'Party',
    // BGG Party Games ranking uses this URL format
    url: 'https://boardgamegeek.com/partygames/browse/boardgame',
    outputFile: 'seed_party.json',
    pages: 1
  },
  {
    name: 'Strategy',
    // BGG Strategy Games ranking
    url: 'https://boardgamegeek.com/strategygames/browse/boardgame',
    outputFile: 'seed_strategy.json',
    pages: 1
  },
  {
    name: 'Family',
    // BGG Family Games ranking
    url: 'https://boardgamegeek.com/familygames/browse/boardgame',
    outputFile: 'seed_family.json',
    pages: 1
  }
];

// Helper: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Parse a BGG browse page
async function parseBGGPage(url, categoryName) {
  console.log(`   📄 Fetching: ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: 30000
  });

  const $ = cheerio.load(response.data);
  const games = [];

  // BGG uses a table with rows
  $('tr[id^="row_"]').each((index, element) => {
    try {
      const $row = $(element);
      
      // Get rank
      const rankText = $row.find('td.collection_rank').text().trim();
      const rank = parseInt(rankText) || (index + 1);
      
      // Get game link and extract ID and name
      const $link = $row.find('td.collection_thumbnail a').first();
      const href = $link.attr('href') || '';
      const idMatch = href.match(/\/boardgame\/(\d+)/);
      const gameId = idMatch ? idMatch[1] : null;
      
      // Get name from the main link
      const $nameLink = $row.find('td.collection_objectname a').first();
      const name = $nameLink.text().trim();
      
      // Get thumbnail
      const $thumbnail = $row.find('td.collection_thumbnail img');
      let thumbnail = $thumbnail.attr('src') || '';
      
      // Convert thumbnail to full-size image URL
      // BGG thumbnails: https://cf.geekdo-images.com/xxx__micro/img/...
      // Full images: https://cf.geekdo-images.com/xxx__original/img/...
      let image = thumbnail
        .replace('__micro', '__original')
        .replace('__thumb', '__original')
        .replace('/fit-in/64x64/', '/original/')
        .replace('/fit-in/200x150/', '/original/');
      
      if (gameId && name) {
        games.push({
          id: gameId,
          rank: rank,
          name: name,
          thumbnail: thumbnail,
          image: image,
          category: categoryName
        });
      }
    } catch (err) {
      console.log(`   ⚠️ Error parsing row: ${err.message}`);
    }
  });

  return games;
}

// Fetch all games for a category
async function fetchCategory(category) {
  console.log(`\n🎲 Fetching ${category.name} Games...`);
  console.log(`   URL: ${category.url}`);
  
  let allGames = [];
  
  for (let page = 1; page <= category.pages; page++) {
    const pageUrl = page === 1 ? category.url : `${category.url}/page/${page}`;
    
    try {
      const games = await parseBGGPage(pageUrl, category.name);
      allGames = allGames.concat(games);
      console.log(`   ✓ Page ${page}: Found ${games.length} games (Total: ${allGames.length})`);
      
      if (page < category.pages) {
        console.log(`   ⏳ Waiting ${DELAY_MS/1000}s...`);
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.log(`   ❌ Error fetching page ${page}: ${err.message}`);
      
      // If the subdomain URL fails, try alternative approach
      if (err.response && err.response.status === 404) {
        console.log(`   🔄 Trying alternative URL format...`);
      }
    }
  }
  
  return allGames;
}

// Main execution
async function main() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🎲 BOARDGAMEGEEK CATEGORY SCRAPER');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const results = {};
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    
    const games = await fetchCategory(category);
    results[category.name] = games;
    
    // Save to file
    const outputPath = path.join(OUTPUT_DIR, category.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
    console.log(`   💾 Saved ${games.length} games to ${category.outputFile}`);
    
    // Wait between categories
    if (i < CATEGORIES.length - 1) {
      console.log(`\n   ⏳ Waiting ${DELAY_MS/1000}s before next category...`);
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✅ SCRAPING COMPLETE');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n📊 Summary:');
  for (const [name, games] of Object.entries(results)) {
    console.log(`   ${name}: ${games.length} games`);
    if (games.length > 0) {
      console.log(`      Top 3: ${games.slice(0, 3).map(g => g.name).join(', ')}`);
    }
  }
  console.log(`\n📅 Completed: ${new Date().toLocaleString()}`);
  console.log('\n🔜 Next step: Run "node scripts/enrich-game-data.js" to get full details');
}

main().catch(console.error);
