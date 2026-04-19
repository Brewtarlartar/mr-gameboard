import { NextResponse } from 'next/server';
import seedGamesData from '@/src/data/seed_games.json';
import seedPartyData from '@/src/data/seed_party.json';
import seedFamilyData from '@/src/data/seed_family.json';
import seedStrategyData from '@/src/data/seed_strategy.json';
import { SeedGame } from '@/types/seedGame';

// Helper to normalize data - handles both array and object with games property
function normalizeGames(data: unknown): SeedGame[] {
  if (Array.isArray(data)) {
    // Data is already an array, map to SeedGame format
    return data.map((game: Record<string, unknown>) => ({
      bggId: String(game.id || ''),
      title: String(game.name || game.title || ''),
      description: String(game.description || ''),
      image: game.image ? String(game.image) : null,
      thumbnail: game.thumbnail ? String(game.thumbnail) : null,
      yearPublished: game.yearPublished ? Number(game.yearPublished) : null,
      minPlayers: game.minPlayers ? Number(game.minPlayers) : null,
      maxPlayers: game.maxPlayers ? Number(game.maxPlayers) : null,
      playingTime: game.playingTime ? Number(game.playingTime) : null,
      minPlayTime: game.minPlayTime ? Number(game.minPlayTime) : null,
      maxPlayTime: game.maxPlayTime ? Number(game.maxPlayTime) : null,
      minAge: game.minAge ? Number(game.minAge) : null,
      rating: game.rating ? Number(game.rating) : null,
      weight: game.weight ? Number(game.weight) : null,
      rank: game.rank ? Number(game.rank) : 0,
      categories: Array.isArray(game.categories) ? game.categories as string[] : [],
      mechanics: Array.isArray(game.mechanics) ? game.mechanics as string[] : [],
      designers: Array.isArray(game.designers) ? game.designers as string[] : [],
      publishers: Array.isArray(game.publishers) ? game.publishers as string[] : [],
    }));
  }
  
  // Data is an object with games property
  const obj = data as { games?: unknown[] };
  if (obj.games && Array.isArray(obj.games)) {
    return normalizeGames(obj.games);
  }
  
  return [];
}

export async function GET() {
  try {
    const top500 = normalizeGames(seedGamesData);
    const party = normalizeGames(seedPartyData);
    const family = normalizeGames(seedFamilyData);
    const strategy = normalizeGames(seedStrategyData);
    
    // Combine all games into a single searchable array for hydration
    const allGames = [...top500, ...party, ...family, ...strategy];
    
    return NextResponse.json({
      categories: {
        top500: {
          name: 'Top 500 Games',
          games: top500,
          count: top500.length,
        },
        party: {
          name: 'Party Games',
          games: party,
          count: party.length,
        },
        family: {
          name: 'Family Games',
          games: family,
          count: family.length,
        },
        strategy: {
          name: 'Strategy Games',
          games: strategy,
          count: strategy.length,
        },
      },
      allGames,
      totalGames: allGames.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading seed games:', error);
    return NextResponse.json(
      { 
        categories: {},
        allGames: [],
        error: 'Failed to load discover games' 
      },
      { status: 500 }
    );
  }
}
