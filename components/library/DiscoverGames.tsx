'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Check,
  Star,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Heart,
  Scale,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store/gameStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { SeedGame } from '@/types/seedGame';
import GameDetailModal from './GameDetailModal';

const FALLBACK_IMAGES: Record<string, string> = {
  '13': 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__original/img/xV7oisd3RQ8R-k18cdWAYthHXsA=/0x0/filters:format(jpeg)/pic2419375.jpg',
  '822': 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__original/img/5aNojpjdSrVg8rRvHiGpg8_Jj1g=/0x0/filters:format(jpeg)/pic1534148.jpg',
  '36218': 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__original/img/75xcxJPIvf-HJJkXc2_W-7na6bs=/0x0/filters:format(jpeg)/pic2582929.jpg',
};

type CategoryKey = 'top500' | 'party' | 'family' | 'strategy';

// Render budget per shelf. Mobile Safari OOM-crashes when all 800 catalog cards
// (each with images and motion wrappers) mount at once. We start small and let
// users tap "Show more" to expand.
const INITIAL_VISIBLE = 60;
const VISIBLE_INCREMENT = 60;

interface ShelfMeta {
  key: CategoryKey;
  description: string;
  badge?: string;
}

const SHELVES: ShelfMeta[] = [
  {
    key: 'top500',
    description: 'Top-ranked classics from across the realm',
    badge: 'BGG Top 500',
  },
  {
    key: 'party',
    description: 'Lively games for gatherings of merry folk',
  },
  {
    key: 'family',
    description: 'Tales for adventurers of every age',
  },
  {
    key: 'strategy',
    description: 'Deep tactics for cunning minds',
  },
];

export default function DiscoverGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingGameId, setAddingGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<SeedGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    discoverCategories,
    discoverLoaded,
    loadDiscoverGames,
    addGameFromSeed,
    isGameOwned,
  } = useGameStore();

  const { addToWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    loadDiscoverGames();
  }, [loadDiscoverGames]);

  const filterGames = (games: SeedGame[]) => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase();
    return games.filter(
      (game) =>
        game.title.toLowerCase().includes(query) ||
        game.categories?.some((c) => c.toLowerCase().includes(query)) ||
        game.mechanics?.some((m) => m.toLowerCase().includes(query)) ||
        game.designers?.some((d) => d.toLowerCase().includes(query))
    );
  };

  const handleAddGame = (game: SeedGame, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingGameId(game.bggId);
    try {
      addGameFromSeed(game);
    } finally {
      setTimeout(() => setAddingGameId(null), 500);
    }
  };

  const handleCardClick = (game: SeedGame) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleAddToWishlist = (game: SeedGame, e: React.MouseEvent) => {
    e.stopPropagation();
    addToWishlist(game);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedGame(null), 300);
  };

  if (!discoverLoaded) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 rounded bg-stone-800/60 animate-pulse" />
            <div className="flex gap-3 sm:gap-4 overflow-hidden">
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="flex-shrink-0 w-44 sm:w-56 h-72 sm:h-80 rounded-xl bg-stone-900/60 border border-amber-900/30 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!discoverCategories) return null;

  const visibleShelves = SHELVES.map((meta) => {
    const cat = discoverCategories[meta.key];
    if (!cat) return null;
    const filtered = filterGames(cat.games);
    return { meta, name: cat.name, totalCount: cat.count, games: filtered };
  }).filter((s): s is NonNullable<typeof s> => s !== null);

  const anyResults = visibleShelves.some((s) => s.games.length > 0);

  return (
    <>
      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the catalog…"
            className="w-full pl-10 pr-10 py-2.5 bg-stone-950/70 border border-amber-900/50 text-amber-100 placeholder-stone-500 rounded-lg font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-300/70 hover:text-amber-100 font-serif"
            >
              Clear
            </button>
          )}
        </div>

        {/* Shelves */}
        {!anyResults ? (
          <div className="bg-stone-900/60 border border-amber-900/40 rounded-2xl p-8 text-center">
            <p className="text-stone-400 font-serif italic">
              No tomes match thy search across the catalog.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleShelves.map((shelf) => {
              if (searchQuery && shelf.games.length === 0) return null;
              return (
                <CatalogShelf
                  key={shelf.meta.key}
                  title={shelf.name}
                  description={shelf.meta.description}
                  badge={shelf.meta.badge}
                  games={shelf.games}
                  totalCount={shelf.totalCount}
                  searching={searchQuery.trim().length > 0}
                  isGameOwned={isGameOwned}
                  isInWishlist={isInWishlist}
                  addingGameId={addingGameId}
                  onAdd={handleAddGame}
                  onAddToWishlist={handleAddToWishlist}
                  onCardClick={handleCardClick}
                />
              );
            })}
          </div>
        )}
      </div>

      <GameDetailModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

interface CatalogShelfProps {
  title: string;
  description: string;
  badge?: string;
  games: SeedGame[];
  totalCount: number;
  searching: boolean;
  isGameOwned: (bggId: string) => boolean;
  isInWishlist: (bggId: string) => boolean;
  addingGameId: string | null;
  onAdd: (game: SeedGame, e: React.MouseEvent) => void;
  onAddToWishlist: (game: SeedGame, e: React.MouseEvent) => void;
  onCardClick: (game: SeedGame) => void;
}

function CatalogShelf({
  title,
  description,
  badge,
  games,
  totalCount,
  searching,
  isGameOwned,
  isInWishlist,
  addingGameId,
  onAdd,
  onAddToWishlist,
  onCardClick,
}: CatalogShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // While searching, the parent already filtered down to a small set — render
  // them all. Otherwise apply the per-shelf render cap to protect mobile Safari.
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const cap = searching ? games.length : visibleCount;
  const visibleGames = games.slice(0, cap);
  const hiddenCount = Math.max(0, games.length - visibleGames.length);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = 400;
    const current = container.scrollLeft;
    const max = container.scrollWidth - container.clientWidth;

    if (direction === 'right') {
      if (current >= max - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: amount, behavior: 'smooth' });
      }
    } else {
      if (current <= 10) {
        container.scrollTo({ left: max, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -amount, behavior: 'smooth' });
      }
    }
  };

  if (games.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1 sm:px-2">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-2xl font-serif font-bold text-amber-100 leading-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] sm:text-xs uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-200 font-serif">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-amber-200/60 italic font-serif leading-tight">
              {description}
            </p>
          </div>
          <span className="text-xs sm:text-sm text-stone-500 font-medium shrink-0">
            ({searching ? `${games.length} of ${totalCount}` : totalCount})
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
          {visibleGames.map((game) => (
            <motion.div
              key={game.bggId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-44 sm:w-56 md:w-60 snap-start"
            >
              <CatalogCard
                game={game}
                isOwned={isGameOwned(game.bggId)}
                inWishlist={isInWishlist(game.bggId)}
                isAdding={addingGameId === game.bggId}
                onAdd={(e) => onAdd(game, e)}
                onAddToWishlist={(e) => onAddToWishlist(game, e)}
                onClick={() => onCardClick(game)}
              />
            </motion.div>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setVisibleCount((n) =>
                  Math.min(n + VISIBLE_INCREMENT, games.length)
                )
              }
              className="flex-shrink-0 w-44 sm:w-56 md:w-60 snap-start aspect-[3/4] flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/40 bg-stone-950/60 hover:bg-stone-900/80 hover:border-amber-400/70 text-amber-200 transition-colors font-serif"
            >
              <ChevronRight className="w-7 h-7 text-amber-400" />
              <span className="text-sm">Show more</span>
              <span className="text-[11px] text-amber-200/60 italic">
                +{Math.min(VISIBLE_INCREMENT, hiddenCount)} of {hiddenCount} left
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CatalogCard({
  game,
  isOwned,
  inWishlist,
  isAdding,
  onAdd,
  onAddToWishlist,
  onClick,
}: {
  game: SeedGame;
  isOwned: boolean;
  inWishlist: boolean;
  isAdding: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onAddToWishlist: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = game.bggId ? FALLBACK_IMAGES[game.bggId] : undefined;
  const imageUrl =
    imageError && fallbackImage ? fallbackImage : game.image || game.thumbnail;
  const hasValidImage =
    imageUrl && imageUrl.trim() !== '' && !(imageError && !fallbackImage);

  return (
    <div
      onClick={onClick}
      className="group relative h-full flex flex-col bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-stone-950/95 border border-amber-900/50 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer hover:shadow-[0_0_18px_-4px_rgba(251,191,36,0.45)] transition-all"
    >
      <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
        {hasValidImage ? (
          <>
            {/* Decorative dark vignette in place of a duplicated blurred <img>
                backdrop — same visual framing without doubling DOM image count. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(120, 53, 15, 0.25) 0%, rgba(0,0,0,0) 60%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={game.title}
              className="relative w-full h-full object-contain z-[1]"
              onError={(e) => {
                if (!imageError && fallbackImage) {
                  setImageError(true);
                  (e.target as HTMLImageElement).src = fallbackImage;
                } else {
                  setImageError(true);
                }
              }}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/30 to-stone-950">
            <span className="text-5xl opacity-40">🎲</span>
          </div>
        )}

        {game.rank && (
          <div className="absolute top-2 left-2 z-[3] flex items-center gap-1 px-2 py-1 bg-amber-600/90 border border-amber-400/40 rounded-md text-xs font-bold text-stone-950 shadow-md">
            #{game.rank}
          </div>
        )}

        <div className="absolute top-2 right-2 z-[3] flex gap-1.5">
          <button
            onClick={onAdd}
            disabled={isOwned || isAdding}
            title={isOwned ? 'In Library' : 'Add to Library'}
            aria-label={isOwned ? 'Already in library' : 'Add to library'}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              isOwned
                ? 'bg-emerald-600/90 border-emerald-400/40 text-stone-950 cursor-default'
                : isAdding
                ? 'bg-amber-500/90 border-amber-400/40 text-stone-950 animate-pulse'
                : 'bg-amber-500/90 hover:bg-amber-400 border-amber-400/40 text-stone-950 hover:scale-110'
            }`}
          >
            {isOwned ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className={`w-4 h-4 ${isAdding ? 'animate-spin' : ''}`} />
            )}
          </button>

          {!isOwned && (
            <button
              onClick={onAddToWishlist}
              disabled={inWishlist}
              title={inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              aria-label={inWishlist ? 'In wishlist' : 'Add to wishlist'}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                inWishlist
                  ? 'bg-rose-600/90 border-rose-400/40 text-rose-50 cursor-default'
                  : 'bg-stone-950/70 hover:bg-rose-600/80 border-amber-900/50 hover:border-rose-400/40 text-amber-200 hover:text-rose-50 hover:scale-110'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${inWishlist ? 'fill-rose-50' : ''}`}
              />
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-950/85 to-transparent z-[2]" />
      </div>

      <div className="p-3 border-t border-amber-900/30 flex-1 flex flex-col space-y-2">
        <h3
          className="font-serif font-semibold text-amber-100 text-sm leading-snug break-words"
          style={{ minHeight: '2.75em' }}
        >
          {game.title}
        </h3>

        {game.yearPublished && (
          <p className="text-[10px] text-amber-200/60 italic font-serif">
            ({game.yearPublished})
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-stone-400">
          {game.minPlayers !== undefined && game.maxPlayers !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500/80" />
              <span>
                {game.minPlayers}-{game.maxPlayers}
              </span>
            </div>
          )}
          {(game.playingTime || game.maxPlayTime) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500/80" />
              <span>{game.playingTime || game.maxPlayTime}m</span>
            </div>
          )}
          {game.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
          )}
          {typeof game.weight === 'number' && game.weight > 0 && (
            <div
              className="flex items-center gap-1"
              title={`Complexity ${game.weight.toFixed(1)} / 5`}
            >
              <Scale className="w-3 h-3 text-amber-500/80" />
              <span>{game.weight.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
