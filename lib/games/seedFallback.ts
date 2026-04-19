/**
 * Local seed-data fallback for the library catalog.
 *
 * Used when the Supabase `bgg_games_cache` is empty or unreachable,
 * so the recommendations / browse / search UX never goes blank.
 */

import seedTop from '@/src/data/seed_games.json';
import seedFamily from '@/src/data/seed_family.json';
import seedParty from '@/src/data/seed_party.json';
import seedStrategy from '@/src/data/seed_strategy.json';
import { Game } from '@/types/game';
import { getStapleGames } from './staples';

type RawSeed = Record<string, unknown>;

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function arr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function toGame(raw: RawSeed): Game {
  const bggId = num(raw.id ?? raw.bggId);
  const name = str(raw.name ?? raw.title) ?? 'Unknown';

  return {
    id: bggId ? `bgg-${bggId}` : `seed-${name}`,
    bggId,
    name,
    description: str(raw.description),
    image: str(raw.image),
    thumbnail: str(raw.thumbnail),
    minPlayers: num(raw.minPlayers),
    maxPlayers: num(raw.maxPlayers),
    playingTime: num(raw.playingTime),
    minPlayingTime: num(raw.minPlayTime ?? raw.minPlayingTime),
    maxPlayingTime: num(raw.maxPlayTime ?? raw.maxPlayingTime),
    complexity: num(raw.weight ?? raw.complexity),
    rating: num(raw.rating),
    yearPublished: num(raw.yearPublished),
    rank: num(raw.rank),
    categories: arr(raw.categories),
    mechanics: arr(raw.mechanics),
    genres: arr(raw.categories),
  };
}

let _allCache: Game[] | null = null;

export function getAllSeedGames(): Game[] {
  if (_allCache) return _allCache;

  const seen = new Set<string>();
  const merged: Game[] = [];

  const sources: unknown[] = [seedTop, seedFamily, seedParty, seedStrategy];
  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const raw of src as RawSeed[]) {
      const game = toGame(raw);
      const key = game.bggId ? `bgg-${game.bggId}` : `name-${game.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(game);
    }
  }

  // Add ubiquitous staples (Catan, Monopoly, UNO, etc.) that aren't in the
  // BGG-top-500 hobby seed but get searched constantly.
  for (const staple of getStapleGames()) {
    const key = staple.bggId ? `bgg-${staple.bggId}` : `name-${staple.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(staple);
  }

  _allCache = merged;
  return merged;
}

function rankedSeed(games: Game[], limit: number): Game[] {
  return [...games]
    .sort((a, b) => {
      const ra = a.rank ?? 9999;
      const rb = b.rank ?? 9999;
      if (ra !== rb) return ra - rb;
      return (b.rating ?? 0) - (a.rating ?? 0);
    })
    .slice(0, limit);
}

export function getTopSeedGames(limit = 50): Game[] {
  return rankedSeed(getAllSeedGames(), limit);
}

interface SeedSection {
  id: string;
  title: string;
  description: string;
  games: Game[];
}

const FAMILY_KEYWORDS = ['family', "children's", 'party'];
const PARTY_KEYWORDS = ['party', 'humor', 'word'];
const COOP_KEYWORDS = ['cooperative'];

function hasCategory(g: Game, keywords: string[]): boolean {
  const cats = (g.genres || g.categories || []).map((c) => c.toLowerCase());
  const mechs = (g.mechanics || []).map((m) => m.toLowerCase());
  for (const k of keywords) {
    if (cats.some((c) => c.includes(k))) return true;
    if (mechs.some((m) => m.includes(k))) return true;
  }
  return false;
}

/**
 * Build curated browse sections from the seed catalog so the user always
 * has something to discover even when the server cache is empty.
 */
export function buildSeedBrowseSections(limit = 16): SeedSection[] {
  const all = getAllSeedGames();

  const topRated = rankedSeed(all, limit);

  const familyPool = all.filter((g) => hasCategory(g, FAMILY_KEYWORDS));
  const family = (familyPool.length
    ? familyPool
    : (seedFamily as unknown as RawSeed[]).map(toGame))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const strategyPool = all.filter((g) => (g.complexity ?? 0) > 2.5);
  const strategy = strategyPool
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const partyPool = all.filter((g) => hasCategory(g, PARTY_KEYWORDS));
  const party = (partyPool.length
    ? partyPool
    : (seedParty as unknown as RawSeed[]).map(toGame))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const quick = all
    .filter((g) => (g.playingTime ?? 999) <= 30 && (g.rating ?? 0) >= 7.0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const twoPlayer = all
    .filter((g) => g.maxPlayers === 2 && (g.rating ?? 0) >= 7.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const heavy = all
    .filter((g) => (g.complexity ?? 0) >= 3.5 && (g.rating ?? 0) >= 7.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  const coop = all
    .filter((g) => hasCategory(g, COOP_KEYWORDS))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);

  return [
    { id: 'top-rated', title: 'The Hall of Legends', description: 'The highest-ranked games on BoardGameGeek', games: topRated },
    { id: 'family', title: 'For the Whole Table', description: 'Family-friendly tomes everyone can join', games: family },
    { id: 'strategy', title: 'Strategist\u2019s Shelf', description: 'Deep, decision-rich tomes', games: strategy },
    { id: 'party', title: 'The Tavern', description: 'Loud, fast, full of laughter', games: party },
    { id: 'quick', title: 'Under Half an Hour', description: 'Quick tomes for short evenings', games: quick },
    { id: 'two-player', title: 'Duels for Two', description: 'Built for head-to-head play', games: twoPlayer },
    { id: 'heavy', title: 'Tomes of Great Weight', description: 'For seasoned strategists only', games: heavy },
    { id: 'coop', title: 'Stand Together', description: 'Cooperative tomes against the table', games: coop },
  ].filter((s) => s.games.length > 0);
}

export interface SeedSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
}

/**
 * Search the local seed data for games matching the query.
 * Used as a search fallback when BGG is slow / blocked.
 */
export function searchSeedGames(query: string, limit = 20): SeedSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter((t) => t.length > 0);

  const all = getAllSeedGames();
  const scored: { game: Game; score: number }[] = [];

  for (const g of all) {
    const name = g.name.toLowerCase();
    if (!g.bggId) continue;

    let score = 0;
    if (name === q) score = 1000;
    else if (name.startsWith(q)) score = 800;
    else if (name.includes(q)) score = 600;
    else if (tokens.length > 1 && tokens.every((t) => name.includes(t))) {
      score = 400;
    } else continue;

    if (g.rank) score -= Math.min(50, Math.floor(g.rank / 10));
    if (g.rating) score += Math.floor(g.rating * 2);

    scored.push({ game: g, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => ({
    id: s.game.bggId!,
    name: s.game.name,
    yearPublished: s.game.yearPublished,
    thumbnail: s.game.thumbnail,
  }));
}
