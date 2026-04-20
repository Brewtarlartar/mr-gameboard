'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Plus,
  Star,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Check,
  Scale,
} from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface BrowseSection {
  id: string;
  title: string;
  description: string;
  games: Game[];
}

interface BrowseCatalogProps {
  onGameSelect?: (game: Game) => void;
  defaultOpen?: boolean;
}

export default function BrowseCatalog({ onGameSelect, defaultOpen = false }: BrowseCatalogProps) {
  const { games, addGame } = useGameStore();
  const [sections, setSections] = useState<BrowseSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [addingId, setAddingId] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const ownedBggIds = useMemo(() => {
    const set = new Set<number>();
    for (const g of games) {
      if (typeof g.bggId === 'number') set.add(g.bggId);
    }
    return set;
  }, [games]);

  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    fetchedRef.current = true;
    setIsLoading(true);
    fetch('/api/games/browse')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && Array.isArray(data.sections)) {
          setSections(data.sections);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const handleAdd = async (game: Game, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!game.bggId || ownedBggIds.has(game.bggId)) return;
    setAddingId(game.bggId);
    try {
      const res = await fetch(`/api/bgg/game/${game.bggId}`);
      if (res.ok) {
        const data = await res.json();
        addGame(data.game);
      } else {
        addGame(game);
      }
    } catch {
      addGame(game);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="space-y-3">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-stone-950/95 via-stone-900/85 to-stone-950/95 hover:from-amber-950/30 hover:via-stone-900/85 hover:to-amber-950/30 border border-amber-900/50 hover:border-amber-500/60 rounded-2xl transition-all shadow-md shadow-black/30 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-amber-600/30 via-amber-900/50 to-stone-950 border border-amber-500/40 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
            <BookOpen className="w-5 h-5 text-amber-200" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-base sm:text-lg font-serif font-bold text-amber-100 leading-tight truncate">
              Browse the Catalog
            </div>
            <div className="text-[11px] sm:text-xs text-amber-200/70 italic font-serif leading-tight truncate">
              Wander the great archives and add new tomes to thy library
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-amber-300 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-8 pt-2">
          {isLoading && sections.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-amber-200/70 font-serif italic">
              <Loader2 className="w-5 h-5 animate-spin" />
              Gathering tomes from the archives…
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-2xl border border-amber-900/40 bg-stone-900/60 p-6 text-center">
              <p className="text-stone-400 text-sm font-serif italic">
                The catalog could not be opened. Try refreshing in a moment.
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <BrowseSectionRow
                key={section.id}
                section={section}
                onAdd={handleAdd}
                onSelect={onGameSelect}
                ownedBggIds={ownedBggIds}
                addingId={addingId}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function BrowseSectionRow({
  section,
  onAdd,
  onSelect,
  ownedBggIds,
  addingId,
}: {
  section: BrowseSection;
  onAdd: (game: Game, e: React.MouseEvent) => void;
  onSelect?: (game: Game) => void;
  ownedBggIds: Set<number>;
  addingId: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1 sm:px-2">
        <div className="min-w-0">
          <h3 className="text-base sm:text-xl font-serif font-bold text-amber-100 leading-tight truncate">
            {section.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-200/60 italic font-serif leading-tight truncate">
            {section.description}
          </p>
        </div>
        <span className="text-[11px] sm:text-xs text-stone-500 shrink-0">
          ({section.games.length})
        </span>
      </div>

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
          {section.games.map((game) => (
            <motion.div
              key={game.bggId || game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-44 sm:w-56 md:w-60 snap-start"
            >
              <BrowseCard
                game={game}
                onAdd={(e) => onAdd(game, e)}
                onSelect={() => onSelect?.(game)}
                isOwned={!!(game.bggId && ownedBggIds.has(game.bggId))}
                isAdding={addingId === game.bggId}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowseCard({
  game,
  onAdd,
  onSelect,
  isOwned,
  isAdding,
}: {
  game: Game;
  onAdd: (e: React.MouseEvent) => void;
  onSelect: () => void;
  isOwned: boolean;
  isAdding: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = game.image || game.thumbnail;
  const hasImage = imageUrl && imageUrl.trim() !== '' && !imageError;

  return (
    <div
      onClick={onSelect}
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

        <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-stone-400">
          {game.minPlayers !== undefined && game.maxPlayers !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500/80" />
              <span>
                {game.minPlayers}-{game.maxPlayers}
              </span>
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
          {typeof game.complexity === 'number' && game.complexity > 0 && (
            <div
              className="flex items-center gap-1"
              title={`Complexity ${game.complexity.toFixed(1)} / 5`}
            >
              <Scale className="w-3 h-3 text-amber-500/80" />
              <span>{game.complexity.toFixed(1)}</span>
            </div>
          )}
        </div>

        {isOwned ? (
          <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 rounded-md text-xs font-semibold">
            <Check className="w-3 h-3" />
            In thy library
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
