import { NextRequest, NextResponse } from 'next/server';
import { getTopGames } from '@/lib/bgg';
import { GameDetail } from '@/types/game';
import { getTopSeedGames } from '@/lib/games/seedFallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  libraryBggIds?: number[];
  favoriteBggIds?: number[];
  topGenres?: string[];
  topMechanics?: string[];
  avgComplexity?: number;
  recentBggIds?: number[];
  limit?: number;
}

interface ScoredGame {
  game: GameDetail;
  score: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    body = {};
  }

  const libraryIds = new Set((body.libraryBggIds || []).map(Number));
  const favoriteIds = new Set((body.favoriteBggIds || []).map(Number));
  const recentIds = new Set((body.recentBggIds || []).map(Number));
  const userGenres = new Set((body.topGenres || []).map((g) => g.toLowerCase()));
  const userMechanics = new Set((body.topMechanics || []).map((m) => m.toLowerCase()));
  const avgComplexity = typeof body.avgComplexity === 'number' ? body.avgComplexity : null;
  const limit = Math.max(1, Math.min(24, body.limit ?? 12));

  // Try the server-side cache first; if it's empty, slow, or errors, fall back to seed.
  let pool: GameDetail[] = [];
  let usedFallback = false;

  try {
    const cached = await Promise.race<GameDetail[]>([
      getTopGames(300),
      new Promise<GameDetail[]>((resolve) => setTimeout(() => resolve([]), 4000)),
    ]);
    if (cached && cached.length > 20) {
      pool = cached;
    } else {
      usedFallback = true;
      pool = getTopSeedGames(200);
    }
  } catch {
    usedFallback = true;
    pool = getTopSeedGames(200);
  }

  if (!pool.length) {
    return NextResponse.json({ ok: true, games: [], source: 'no-data' });
  }

  const candidates = pool.filter((g) => g.bggId && !libraryIds.has(g.bggId));

  const scored: ScoredGame[] = candidates.map((g) => {
    let score = 0;
    const reasons: string[] = [];

    const candidateGenres = (g.genres || g.categories || []).map((c) => c.toLowerCase());
    const candidateMechanics = (g.mechanics || []).map((m) => m.toLowerCase());

    let genreOverlap = 0;
    for (const genre of candidateGenres) {
      if (userGenres.has(genre)) genreOverlap += 1;
    }
    if (genreOverlap > 0) {
      score += genreOverlap * 3;
      reasons.push(`${genreOverlap} matching ${genreOverlap === 1 ? 'genre' : 'genres'}`);
    }

    let mechanicOverlap = 0;
    for (const mech of candidateMechanics) {
      if (userMechanics.has(mech)) mechanicOverlap += 1;
    }
    if (mechanicOverlap > 0) {
      score += mechanicOverlap * 2;
      reasons.push(`${mechanicOverlap} matching ${mechanicOverlap === 1 ? 'mechanic' : 'mechanics'}`);
    }

    if (avgComplexity !== null && g.complexity !== undefined && g.complexity !== null) {
      const diff = Math.abs(avgComplexity - g.complexity);
      if (diff <= 0.5) {
        score += 5;
        reasons.push('matches your weight');
      } else if (diff <= 1.0) {
        score += 2;
      }
    }

    if (g.rank && g.rank <= 100) score += 1;
    if (g.rank && g.rank <= 25) score += 1;
    if (g.rating && g.rating >= 8.0) score += 1;
    if (g.bggId && recentIds.has(g.bggId)) score += 2;

    return {
      game: g,
      score,
      reason: reasons[0] || (g.rank ? `BGG #${g.rank}` : 'Top-rated'),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const rankA = a.game.rank ?? 9999;
    const rankB = b.game.rank ?? 9999;
    return rankA - rankB;
  });

  const top = scored.slice(0, limit).map((s) => ({
    ...s.game,
    id: s.game.bggId ? `bgg-${s.game.bggId}` : s.game.id,
    recommendationReason: s.reason,
    recommendationScore: s.score,
  }));

  const personalized = userGenres.size > 0 || userMechanics.size > 0 || avgComplexity !== null;

  return NextResponse.json({
    ok: true,
    games: top,
    source: usedFallback
      ? personalized
        ? 'seed-personalized'
        : 'seed-top'
      : personalized
      ? 'personalized'
      : 'top-rated',
    poolSize: candidates.length,
  });
}
