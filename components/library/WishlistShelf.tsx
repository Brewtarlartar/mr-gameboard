'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Trash2,
  Star,
  Users,
  Clock,
  Plus,
  Check,
  ShoppingCart,
  Flag,
} from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useGameStore } from '@/lib/store/gameStore';
import { SeedGame } from '@/types/seedGame';
import GameDetailModal from './GameDetailModal';

const PRIORITY_STYLES: Record<
  'low' | 'medium' | 'high',
  { label: string; badgeClass: string }
> = {
  low: {
    label: 'Low',
    badgeClass: 'bg-stone-800/80 text-stone-300 border-stone-700',
  },
  medium: {
    label: 'Medium',
    badgeClass:
      'bg-amber-500/15 text-amber-200 border-amber-500/50 shadow-[0_0_8px_-2px_rgba(251,191,36,0.35)]',
  },
  high: {
    label: 'Desired',
    badgeClass:
      'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-[0_0_8px_-2px_rgba(244,63,94,0.4)]',
  },
};

type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

export default function WishlistShelf() {
  const { wishlist, removeFromWishlist, updateWishlistItem } = useWishlistStore();
  const { addGameFromSeed, isGameOwned } = useGameStore();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedGame, setSelectedGame] = useState<SeedGame | null>(null);

  const visibleItems = useMemo(() => {
    if (priorityFilter === 'all') return wishlist;
    return wishlist.filter((item) => item.priority === priorityFilter);
  }, [wishlist, priorityFilter]);

  if (wishlist.length === 0) {
    return (
      <div className="bg-gradient-to-b from-stone-900/70 to-stone-950/80 border border-amber-900/50 rounded-2xl p-10 sm:p-12 text-center shadow-lg shadow-black/30">
        <Heart className="w-14 h-14 text-rose-400/70 mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 mb-2">
          Thy wishlist is yet a blank scroll
        </h2>
        <p className="text-amber-200/70 font-serif italic max-w-md mx-auto">
          Tap the heart on any game in the Catalog, Discover shelves, or a
          game&rsquo;s detail page to add it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Flag className="w-4 h-4 text-rose-300/80" />
        <span className="text-xs font-serif italic text-amber-200/70 mr-1">
          Priority:
        </span>
        {(['all', 'high', 'medium', 'low'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setPriorityFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              priorityFilter === value
                ? 'bg-amber-500/20 text-amber-100 border-amber-500/50'
                : 'bg-stone-900/60 text-stone-300 border-amber-900/40 hover:border-amber-500/40'
            }`}
          >
            {value === 'all'
              ? `All (${wishlist.length})`
              : PRIORITY_STYLES[value].label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="bg-stone-900/60 border border-amber-900/40 rounded-2xl p-8 text-center">
          <p className="text-stone-400 font-serif italic">
            No games match this priority.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatePresence initial={false}>
            {visibleItems.map((item) => {
              const owned = isGameOwned(item.game.bggId);
              const priority = PRIORITY_STYLES[item.priority];
              const imageUrl = item.game.image || item.game.thumbnail;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.22 }}
                  className="group relative h-full flex flex-col bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-stone-950/95 border border-amber-900/50 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer hover:shadow-[0_0_18px_-4px_rgba(251,191,36,0.45)] transition-all"
                  onClick={() => setSelectedGame(item.game)}
                >
                  <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={item.game.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-5xl opacity-40">🎲</span>
                    )}

                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-serif font-semibold border ${priority.badgeClass}`}
                    >
                      {priority.label}
                    </div>

                    {owned && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-500/20 text-emerald-100 border-emerald-400/40">
                        <Check className="w-3 h-3" />
                        Owned
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-950/85 to-transparent" />
                  </div>

                  <div className="p-3 border-t border-amber-900/30 flex-1 flex flex-col">
                    <h3
                      className="font-serif font-semibold text-amber-100 text-sm leading-snug break-words"
                      style={{ minHeight: '2.75em' }}
                    >
                      {item.game.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-400">
                      {item.game.minPlayers !== null &&
                        item.game.maxPlayers !== null && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-500/80" />
                            <span>
                              {item.game.minPlayers}-{item.game.maxPlayers}
                            </span>
                          </div>
                        )}
                      {(item.game.playingTime || item.game.maxPlayTime) && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500/80" />
                          <span>
                            {item.game.playingTime || item.game.maxPlayTime}m
                          </span>
                        </div>
                      )}
                      {item.game.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.game.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3 space-y-2">
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(['low', 'medium', 'high'] as const).map((priorityKey) => (
                          <button
                            key={priorityKey}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWishlistItem(item.id, {
                                priority: priorityKey,
                              });
                            }}
                            className={`flex-1 px-1.5 py-1 rounded-md text-[10px] font-serif font-semibold uppercase tracking-wide transition-colors border ${
                              item.priority === priorityKey
                                ? PRIORITY_STYLES[priorityKey].badgeClass
                                : 'bg-stone-900/60 text-stone-400 border-amber-900/40 hover:text-amber-100'
                            }`}
                            aria-label={`Set priority to ${PRIORITY_STYLES[priorityKey].label}`}
                          >
                            {PRIORITY_STYLES[priorityKey].label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {owned ? (
                          <div className="col-span-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 rounded-md text-[11px] font-serif font-semibold">
                            <Check className="w-3 h-3" />
                            In thy library
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addGameFromSeed(item.game);
                              removeFromWishlist(item.id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 rounded-md text-[11px] font-serif font-semibold shadow-sm shadow-amber-900/30 transition-colors"
                            aria-label={`Add ${item.game.title} to library`}
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                        <a
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(
                            item.game.title,
                          )}&tag=mrboardgame-20`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-md text-[11px] font-serif font-semibold transition-colors ${
                            owned ? 'hidden' : ''
                          }`}
                          aria-label={`Find ${item.game.title} on Amazon`}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Buy
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.id);
                          }}
                          className={`flex items-center justify-center gap-1 px-2 py-1.5 bg-stone-900/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-stone-300 hover:text-red-200 rounded-md text-[11px] font-serif font-semibold transition-colors ${
                            owned ? 'col-span-2' : ''
                          }`}
                          aria-label={`Remove ${item.game.title} from wishlist`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <GameDetailModal
        game={selectedGame}
        isOpen={selectedGame !== null}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
