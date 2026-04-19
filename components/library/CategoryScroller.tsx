'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Game } from '@/types/game';
import GameCard from './GameCard';

interface CategoryScrollerProps {
  title: string;
  games: Game[];
  icon?: React.ReactNode;
  description?: string;
  onGameSelect: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onRemove?: (gameId: string) => void;
  favorites: string[];
}

export default function CategoryScroller({
  title,
  games,
  icon,
  description,
  onGameSelect,
  onToggleFavorite,
  onRemove,
  favorites,
}: CategoryScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = 400;
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (direction === 'right') {
      if (currentScroll >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (currentScroll <= 10) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  if (games.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1 sm:px-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-lg sm:text-2xl font-serif font-bold text-amber-100 leading-tight truncate">
              {title}
            </h3>
            {description && (
              <p className="text-[11px] sm:text-xs text-amber-200/60 italic font-serif leading-tight truncate">
                {description}
              </p>
            )}
          </div>
          <span className="text-xs sm:text-sm text-stone-500 font-medium shrink-0">
            ({games.length})
          </span>
        </div>
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
          {games.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-44 sm:w-56 md:w-60 snap-start"
            >
              <GameCard
                game={game}
                onSelect={onGameSelect}
                onToggleFavorite={onToggleFavorite}
                onRemove={onRemove}
                isFavorite={favorites.includes(game.id)}
                isOwned={true}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
