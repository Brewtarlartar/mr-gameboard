import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';

/**
 * API endpoint to enrich game descriptions from BGG
 * This will fetch full data for games that have missing or incomplete descriptions
 * Tries Supabase cache first, then falls back to BGG API if needed
 */
export async function POST(request: NextRequest) {
  try {
    const { games } = await request.json();

    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: 'Games array required' }, { status: 400 });
    }

    const enrichedGames = [];
    const errors = [];
    let cacheHits = 0;
    let apiCalls = 0;

    // Process each game
    for (const game of games) {
      try {
        // Skip if game doesn't have a BGG ID
        if (!game.bggId) {
          enrichedGames.push(game);
          continue;
        }

        // Skip if game already has images AND good description (>200 characters)
        const hasCompleteData = (game.image || game.thumbnail) && 
                                game.description && 
                                game.description.length > 200;
        if (hasCompleteData) {
          enrichedGames.push(game);
          continue;
        }

        console.log(`[Enrich] Fetching data for ${game.name} (BGG ID: ${game.bggId})`);

        // First, try Supabase cache
        const cachedGame = await getGameDetails(game.bggId);
        
        if (cachedGame && (cachedGame.image || cachedGame.thumbnail)) {
          console.log(`[Enrich] ✅ Found ${game.name} in cache`);
          cacheHits++;
          
          // Merge cached data with existing game data
          enrichedGames.push({
            ...game,
            description: cachedGame.description || game.description,
            image: cachedGame.image || game.image,
            thumbnail: cachedGame.thumbnail || game.thumbnail,
            minPlayers: game.minPlayers ?? cachedGame.minPlayers,
            maxPlayers: game.maxPlayers ?? cachedGame.maxPlayers,
            playingTime: game.playingTime ?? cachedGame.playingTime,
            minPlayingTime: game.minPlayingTime ?? cachedGame.minPlayingTime,
            maxPlayingTime: game.maxPlayingTime ?? cachedGame.maxPlayingTime,
            yearPublished: game.yearPublished ?? cachedGame.yearPublished,
            rating: game.rating ?? cachedGame.rating,
            complexity: game.complexity ?? cachedGame.complexity,
            categories: game.categories?.length > 0 ? game.categories : cachedGame.categories,
            mechanics: game.mechanics?.length > 0 ? game.mechanics : cachedGame.mechanics,
            genres: game.genres?.length > 0 ? game.genres : cachedGame.genres,
            rulebookUrl: game.rulebookUrl || cachedGame.rulebookUrl,
          });
          continue;
        }

        // If not in cache, try BGG API as fallback
        console.log(`[Enrich] Game ${game.name} not in cache, trying BGG API...`);
        apiCalls++;
        
        const response = await fetch(
          `https://boardgamegeek.com/xmlapi2/thing?id=${game.bggId}&stats=1`,
          {
            headers: {
              'Accept': 'application/xml',
              'User-Agent': 'BoardGameCompanion/1.0',
            },
          }
        );

        if (!response.ok) {
          console.error(`[Enrich] BGG API error ${response.status} for ${game.name}`);
          errors.push({ gameId: game.id, name: game.name, error: `BGG API error: ${response.status}` });
          enrichedGames.push(game);
          continue;
        }

        const xml = await response.text();

        // Parse description and other missing fields
        const getContent = (tag: string): string | undefined => {
          const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
          const match = xml.match(regex);
          return match ? match[1].trim() : undefined;
        };

        const getValue = (tag: string): string | undefined => {
          const regex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i');
          const match = xml.match(regex);
          return match ? match[1] : undefined;
        };

        // Get full description without truncation
        const rawDescription = getContent('description');
        const description = rawDescription
          ?.replace(/&#10;/g, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .trim();

        // Get other potentially missing fields
        const image = getContent('image');
        const thumbnail = getContent('thumbnail');
        const minPlayers = getValue('minplayers');
        const maxPlayers = getValue('maxplayers');
        const playingTime = getValue('playingtime');
        const minPlayTime = getValue('minplaytime');
        const maxPlayTime = getValue('maxplaytime');
        const yearPublished = getValue('yearpublished');

        // Get ratings if missing
        const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"/i);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

        const weightMatch = xml.match(/<averageweight[^>]*value="([^"]*)"/i);
        const complexity = weightMatch ? parseFloat(weightMatch[1]) : undefined;

        // Get categories if missing
        const categories: string[] = [];
        const categoryRegex = /<link[^>]*type="boardgamecategory"[^>]*value="([^"]*)"/gi;
        let catMatch;
        while ((catMatch = categoryRegex.exec(xml)) !== null) {
          categories.push(catMatch[1]);
        }

        // Get mechanics if missing
        const mechanics: string[] = [];
        const mechanicRegex = /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]*)"/gi;
        let mechMatch;
        while ((mechMatch = mechanicRegex.exec(xml)) !== null) {
          mechanics.push(mechMatch[1]);
        }

        // Merge with existing game data, keeping existing values where present
        const enrichedGame = {
          ...game,
          description: description || game.description,
          image: image || game.image,
          thumbnail: thumbnail || game.thumbnail,
          minPlayers: game.minPlayers ?? (minPlayers ? parseInt(minPlayers) : undefined),
          maxPlayers: game.maxPlayers ?? (maxPlayers ? parseInt(maxPlayers) : undefined),
          playingTime: game.playingTime ?? (playingTime ? parseInt(playingTime) : undefined),
          minPlayingTime: game.minPlayingTime ?? (minPlayTime ? parseInt(minPlayTime) : undefined),
          maxPlayingTime: game.maxPlayingTime ?? (maxPlayTime ? parseInt(maxPlayTime) : undefined),
          yearPublished: game.yearPublished ?? (yearPublished ? parseInt(yearPublished) : undefined),
          rating: game.rating ?? rating,
          complexity: game.complexity ?? complexity,
          categories: game.categories?.length > 0 ? game.categories : categories.slice(0, 5),
          mechanics: game.mechanics?.length > 0 ? game.mechanics : mechanics.slice(0, 5),
          genres: game.genres?.length > 0 ? game.genres : categories.slice(0, 5),
          rulebookUrl: game.rulebookUrl || `https://boardgamegeek.com/boardgame/${game.bggId}/files`,
        };

        enrichedGames.push(enrichedGame);
        console.log(`[Enrich] ✅ Successfully enriched ${game.name} from BGG API`);

        // Add a delay to avoid overwhelming BGG API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Enrich] Error processing ${game.name}:`, error);
        errors.push({ 
          gameId: game.id, 
          name: game.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        enrichedGames.push(game);
      }
    }

    return NextResponse.json({
      success: true,
      enrichedGames,
      errors: errors.length > 0 ? errors : undefined,
      stats: {
        total: games.length,
        enriched: enrichedGames.filter(g => (g.image || g.thumbnail) && g.description && g.description.length > 200).length,
        failed: errors.length,
        cacheHits,
        apiCalls,
      }
    });

  } catch (error) {
    console.error('[Enrich] API error:', error);
    return NextResponse.json({ 
      error: 'Failed to enrich games',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
