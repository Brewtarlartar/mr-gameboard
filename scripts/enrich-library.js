#!/usr/bin/env node

/**
 * Script to enrich game descriptions in localStorage from BGG
 * 
 * This script can be run from the browser console to manually enrich
 * all games in your library with complete descriptions from BoardGameGeek.
 * 
 * Usage:
 * 1. Open your browser console (F12 or Cmd+Opt+J)
 * 2. Copy and paste this entire script
 * 3. The script will automatically run and update your games
 * 
 * Alternatively, use the "Enrich Descriptions" button in the Library UI
 */

(async function enrichLibraryFromBrowser() {
  console.log('🎲 Starting library enrichment...');
  
  // Get games from localStorage
  const libraryJson = localStorage.getItem('mr-boardgame-library');
  if (!libraryJson) {
    console.error('❌ No game library found in localStorage');
    return;
  }
  
  let games;
  try {
    games = JSON.parse(libraryJson);
  } catch (error) {
    console.error('❌ Failed to parse game library:', error);
    return;
  }
  
  if (!Array.isArray(games) || games.length === 0) {
    console.log('ℹ️ No games to enrich');
    return;
  }
  
  console.log(`📚 Found ${games.length} games in library`);
  
  // Find games needing enrichment
  const gamesNeedingEnrichment = games.filter(game => {
    if (!game.bggId) return false;
    if (!game.description || game.description.length < 200) return true;
    return false;
  });
  
  console.log(`📝 ${gamesNeedingEnrichment.length} games need enrichment`);
  
  if (gamesNeedingEnrichment.length === 0) {
    console.log('✅ All games already have good descriptions!');
    return;
  }
  
  // Enrich each game
  const enrichedGames = [...games];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < gamesNeedingEnrichment.length; i++) {
    const game = gamesNeedingEnrichment[i];
    const gameIndex = games.findIndex(g => g.id === game.id);
    
    if (gameIndex === -1) continue;
    
    try {
      console.log(`[${i + 1}/${gamesNeedingEnrichment.length}] Fetching ${game.name}...`);
      
      // Fetch from BGG
      const response = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${game.bggId}&stats=1`
      );
      
      if (!response.ok) {
        throw new Error(`BGG API returned ${response.status}`);
      }
      
      const xml = await response.text();
      
      // Parse description
      const descMatch = xml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      if (descMatch) {
        const description = descMatch[1]
          .replace(/&#10;/g, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .trim();
        
        enrichedGames[gameIndex] = {
          ...enrichedGames[gameIndex],
          description,
        };
        
        successCount++;
        console.log(`  ✓ Enriched ${game.name}`);
      } else {
        console.log(`  ⚠️ No description found for ${game.name}`);
      }
      
      // Rate limit: wait 300ms between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to enrich ${game.name}:`, error.message);
    }
  }
  
  // Save enriched games back to localStorage
  try {
    localStorage.setItem('mr-boardgame-library', JSON.stringify(enrichedGames));
    console.log('💾 Saved enriched library to localStorage');
  } catch (error) {
    console.error('❌ Failed to save enriched library:', error);
    return;
  }
  
  // Summary
  console.log('\n📊 Enrichment Summary:');
  console.log(`  ✓ Successfully enriched: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📚 Total games: ${games.length}`);
  console.log('\n✅ Library enrichment complete! Refresh the page to see changes.');
  
  // Trigger a custom event to notify the app
  window.dispatchEvent(new CustomEvent('library-enriched', { 
    detail: { successCount, errorCount } 
  }));
})();
