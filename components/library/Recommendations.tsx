'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, RefreshCw, Star, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface RecommendedGame extends Game {
  recommendationReason?: string;
  recommendationScore?: number;
}

interface RecommendationsProps {
  onGameSelect?: (game: Game) => void;
}

export default function Recommendations({ onGameSelect }: RecommendationsProps) {
  const { games, favorites, addGame } = useGameStore();
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const signals = useMemo(() => {
    const libraryBggIds = games
      .map((g) => g.bggId)
      .filter((id): id is number => typeof id === 'number');

    const favoriteBggIds = games
      .filter((g) => favorites.includes(g.id))
      .map((g) => g.bggId)
      .filter((id): id is number => typeof id === 'number');

    const recentBggIds = games
      .slice(-10)
      .map((g) => g.bggId)
      .filter((id): id is number => typeof id === 'number');

    const genreCounts = new Map<string, number>();
    const mechanicCounts = new Map<string, number>();
    const complexities: number[] = [];

    for (const g of games) {
      const tags = [...(g.genres || []), ...(g.categories || [])];
      for (const t of tags) {
        if (!t) continue;
        genreCounts.set(t, (genreCounts.get(t) || 0) + 1);
      }
      for (const m of g.mechanics || []) {
        if (!m) continue;
        mechanicCounts.set(m, (mechanicCounts.get(m) || 0) + 1);
      }
      if (typeof g.complexity === 'number' && g.complexity > 0) {
        complexities.push(g.complexity);
      }
    }

    const topGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const topMechanics = [...mechanicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const avgComplexity = complexities.length
      ? complexities.reduce((a, b) => a + b, 0) / complexities.length
      : null;

    return { libraryBggIds, favoriteBggIds, recentBggIds, topGenres, topMechanics, avgComplexity };
  }, [games, favorites]);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/games/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libraryBggIds: signals.libraryBggIds,
          favoriteBggIds: signals.favoriteBggIds,
          recentBggIds: signals.recentBggIds,
          topGenres: signals.topGenres,
          topMechanics: signals.topMechanics,
          avgComplexity: signals.avgComplexity,
          limit: 16,
        }),
      });

      if (!res.ok) {
        setRecommendations([]);
        return;
      }
      const data = await res.json();
      setRecommendations(Array.isArray(data.games) ? data.games : []);
    } catch {
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [signals]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleAdd = async (game: RecommendedGame, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!game.bggId) return;
    setAddingId(game.bggId);
    try {
      const response = await fetch(`/api/bgg/game/${game.bggId}`);
      if (response.ok) {
        const data = await response.json();
        addGame(data.game);
      } else {
        addGame(game);
      }
      setRecommendations((prev) => prev.filter((g) => g.bggId !== game.bggId));
    } catch {
      addGame(game);
      setRecommendations((prev) => prev.filter((g) => g.bggId !== game.bggId));
    } finally {
      setAddingId(null);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = 400;
    if (direction === 'right') {
      container.scrollBy({ left: amount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -amount, behavior: 'smooth' });
    }
  };

  const subtitle =
    games.length === 0
      ? 'Begin thy quest with these celebrated tomes'
      : signals.topGenres.length > 0
      ? `Drawn from thy love of ${signals.topGenres.slice(0, 2).join(' & ')}`
      : 'Curated from the highest-ranked games';

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1 sm:px-2">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-2xl font-serif font-bold text-amber-100 leading-tight truncate">
            Recommended For You
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-200/60 italic font-serif leading-tight truncate">
            {subtitle}
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/70 hover:bg-stone-800 border border-amber-900/50 text-amber-200 rounded-lg transition-colors disabled:opacity-50 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {isLoading && recommendations.length === 0 ? (
        <div className="flex gap-3 sm:gap-4 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 sm:w-56 h-72 sm:h-80 rounded-xl bg-stone-900/60 border border-amber-900/30 animate-pulse"
            />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border border-amber-900/40 bg-stone-900/60 p-6 text-center">
          <p className="text-stone-400 text-sm font-serif italic">
            The Tome is gathering its wisdom. Add a few games and return shortly.
          </p>
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-stone-950/80 hover:bg-stone-900 border border-amber-900/50 backdrop-blur-sm rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-amber-200" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-stone-950/80 hover:bg-stone-900 border border-amber-900/50 backdrop-blur-sm rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-amber-200" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recommendations.map((game) => (
              <motion.div
                key={game.bggId || game.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 w-44 sm:w-56 md:w-60 snap-start"
              >
                <RecCard
                  game={game}
                  onAdd={(e) => handleAdd(game, e)}
                  onClick={() => onGameSelect?.(game)}
                  isAdding={addingId === game.bggId}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function RecCard({
  game,
  onAdd,
  onClick,
  isAdding,
}: {
  game: RecommendedGame;
  onAdd: (e: React.MouseEvent) => void;
  onClick: () => void;
  isAdding: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = game.image || game.thumbnail;
  const hasImage = imageUrl && imageUrl.trim() !== '' && !imageError;

  return (
    <div
      onClick={onClick}
      className="group relative h-full flex flex-col bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-stone-950/95 border border-amber-900/50 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer hover:shadow-[0_0_18px_-4px_rgba(251,191,36,0.45)] transition-all"
    >
      <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={game.name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/30 to-stone-950">
            <span className="text-5xl opacity-40">🎲</span>
          </div>
        )}

        {game.rank && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-600/90 border border-amber-400/40 rounded-md text-xs font-bold text-stone-950 shadow-md">
            #{game.rank}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-950/85 to-transparent" />
      </div>

      <div className="p-3 border-t border-amber-900/30 flex-1 flex flex-col space-y-2">
        <h3
          className="font-serif font-semibold text-amber-100 text-sm leading-snug break-words"
          style={{ minHeight: '2.75em' }}
        >
          {game.name}
        </h3>

        {game.recommendationReason && (
          <p className="text-[10px] text-amber-200/70 italic font-serif line-clamp-2">
            {game.recommendationReason}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-stone-400">
          {game.minPlayers !== undefined && game.maxPlayers !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500/80" />
              <span>{game.minPlayers}-{game.maxPlayers}</span>
            </div>
          )}
          {game.playingTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500/80" />
              <span>{game.playingTime}m</span>
            </div>
          )}
          {game.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <button
          onClick={onAdd}
          disabled={isAdding}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-md text-xs font-semibold transition-colors disabled:opacity-60"
        >
          {isAdding ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          {isAdding ? 'Adding…' : 'Add to Library'}
        </button>
      </div>
    </div>
  );
}
