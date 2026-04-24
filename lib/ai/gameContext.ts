import type { SupabaseClient } from '@supabase/supabase-js';
import { buildGameContext } from './prompts';

type BggRow = {
  name: string | null;
  description: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  complexity: number | null;
  year_published: number | null;
  categories: string[] | null;
  mechanics: string[] | null;
};

export type GameContextExtras = {
  gameName?: string;
  faction?: string;
  playerCount?: number;
  players?: Array<{ name: string; faction?: string }>;
};

export async function buildHydratedGameContext(
  supabase: SupabaseClient,
  bggId: number | null | undefined,
  extras: GameContextExtras = {},
): Promise<string | null> {
  if (!bggId || !Number.isFinite(bggId)) {
    return extras.gameName ? buildGameContext(extras) : null;
  }

  const { data } = await supabase
    .from('bgg_games_cache')
    .select(
      'name, description, min_players, max_players, playing_time, complexity, year_published, categories, mechanics',
    )
    .eq('bgg_id', bggId)
    .maybeSingle<BggRow>();

  if (!data) {
    return extras.gameName ? buildGameContext(extras) : null;
  }

  return buildGameContext({
    gameName: extras.gameName || data.name || undefined,
    faction: extras.faction,
    playerCount: extras.playerCount,
    players: extras.players,
    description: data.description,
    mechanics: data.mechanics,
    categories: data.categories,
    complexity: data.complexity,
    minPlayers: data.min_players,
    maxPlayers: data.max_players,
    playingTime: data.playing_time,
    yearPublished: data.year_published,
  });
}
