import { NextRequest, NextResponse } from 'next/server';
import { getGameDetails } from '@/lib/bgg';
import { getStapleGames } from '@/lib/games/staples';
import { Game } from '@/types/game';

/**
 * Overlay a known-good staple record (curated cf.geekdo-images.com URLs) on
 * top of an enriched game. Image fields from the staple win because the
 * Supabase cache has historically stored stale geekdo URLs that 404. All
 * other fields prefer the existing/cached value.
 */
function applyStapleOverlay<T extends Partial<Game>>(game: T): T {
  if (!game.bggId) return game;
  const staple = getStapleGames().find((g) => g.bggId === game.bggId);
  if (!staple) return game;

  return {
    ...game,
    image: staple.image || game.image,
    thumbnail: staple.thumbnail || game.thumbnail,
  };
}

/**
 * API endpoint to enrich game descriptions from BGG
 * This will fetch full data for games that have missing or incomplete descriptions
 * Tries Supabase cache first, then falls back to BGG API if needed
 */
// This endpoint is public and does a live BGG fetch per cache-miss. Bound both
// the array size (so we never iterate an unbounded list) and the number of live
// BGG calls (so a request full of uncached ids can't hammer BGG from our IPs).
// Every game is still returned — games past the budget just pass through
// unenriched, so callers that replace the library with the response never lose rows.
const MAX_GAMES = 500;
const MAX_LIVE_BGG_CALLS = 25;

export async function POST(request: NextRequest) {
  try {
    const { games: rawGames } = await request.json();

    if (!rawGames || !Array.isArray(rawGames)) {
      return NextResponse.json({ error: 'Games array required' }, { status: 400 });
    }

    const games = rawGames.slice(0, MAX_GAMES);

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

        // Skip if game already has images AND good description (>200 characters).
        // Even on the skip path we run the staple overlay so any stale image
        // URLs get replaced by curated current ones.
        const hasCompleteData = (game.image || game.thumbnail) && 
                                game.description && 
                                game.description.length > 200;
        if (hasCompleteData) {
          enrichedGames.push(applyStapleOverlay(game));
          continue;
        }

        // First, try Supabase cache
        const cachedGame = await getGameDetails(game.bggId);

        if (cachedGame && (cachedGame.image || cachedGame.thumbnail)) {
          cacheHits++;
          
          // Merge cached data with existing game data
          enrichedGames.push(applyStapleOverlay({
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
          }));
          continue;
        }

        // If not in cache, try BGG API as fallback — but only within the live-call
        // budget. Past it, pass the game through unenriched (the nightly cron will
        // fill these in) rather than making unbounded outbound requests.
        if (apiCalls >= MAX_LIVE_BGG_CALLS) {
          enrichedGames.push(game);
          continue;
        }
        apiCalls++;

        // Authorize + time-bound the BGG call. Anonymous requests now 401, and an
        // untimed fetch can pin the serverless function for its whole duration.
        const bggToken = process.env.BGG_API_TOKEN?.trim();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response: Response;
        try {
          response = await fetch(
            `https://boardgamegeek.com/xmlapi2/thing?id=${game.bggId}&stats=1`,
            {
              headers: {
                'Accept': 'application/xml',
                'User-Agent': process.env.BGG_USER_AGENT || 'TheTome/1.0 (mr-gameboard)',
                ...(bggToken ? { Authorization: `Bearer ${bggToken}` } : {}),
              },
              signal: controller.signal,
              cache: 'no-store',
            }
          );
        } finally {
          clearTimeout(timeout);
        }

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
          rulebookUrl: game.bggId ? `/api/rulebook/${game.bggId}` : game.rulebookUrl,
        };

        enrichedGames.push(applyStapleOverlay(enrichedGame));

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
