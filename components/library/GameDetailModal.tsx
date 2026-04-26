'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Check,
  Users,
  Clock,
  Star,
  Scale,
  Calendar,
  Loader2,
  BookOpen,
  Trophy,
  Wrench,
  User,
  ShoppingCart,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { SeedGame } from '@/types/seedGame';
import { useGameStore } from '@/lib/store/gameStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';

interface BGGComment {
  username: string;
  rating: number | null;
  comment: string;
  date: string;
}

interface LiveGameDetails {
  id: string;
  name: string;
  description: string;
  image: string | null;
  thumbnail: string | null;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  minAge: number | null;
  rating: number | null;
  weight: number | null;
  numRatings: number | null;
  rank: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  comments: BGGComment[];
  howToPlaySummary: string | null;
}

interface GameDetailModalProps {
  game: SeedGame | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GameDetailModal({
  game,
  isOpen,
  onClose,
}: GameDetailModalProps) {
  const [liveDetails, setLiveDetails] = useState<LiveGameDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [, setDetailsError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { isGameOwned, addGameFromSeed, removeGame } = useGameStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  const isOwned = game ? isGameOwned(game.bggId) : false;
  const inWishlist = game ? isInWishlist(game.bggId) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && game?.bggId) {
      fetchLiveGameDetails(game.bggId);
    }
    if (!isOpen) {
      setLiveDetails(null);
      setDetailsError(null);
      setImageError(false);
    }
  }, [isOpen, game?.bggId]);

  const fetchLiveGameDetails = async (gameId: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const response = await fetch(`/api/bgg/details/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game details');
      const data = await response.json();
      setLiveDetails(data);
    } catch {
      setDetailsError('Could not load additional details from BGG');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddToCollection = () => {
    if (!game) return;
    setIsAdding(true);
    try {
      addGameFromSeed(game);
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleRemoveFromCollection = () => {
    if (!game) return;
    removeGame(`bgg-${game.bggId}`);
    onClose();
  };

  const handleToggleWishlist = () => {
    if (!game) return;
    if (inWishlist) {
      const wishlistItem = useWishlistStore
        .getState()
        .wishlist.find((item) => item.game.bggId === game.bggId);
      if (wishlistItem) removeFromWishlist(wishlistItem.id);
    } else {
      addToWishlist(game);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!game) return null;

  const displayData = {
    name: liveDetails?.name || game.title,
    description: liveDetails?.description || game.description,
    image: liveDetails?.image || game.image,
    thumbnail: liveDetails?.thumbnail || game.thumbnail,
    yearPublished: liveDetails?.yearPublished || game.yearPublished,
    minPlayers: liveDetails?.minPlayers || game.minPlayers,
    maxPlayers: liveDetails?.maxPlayers || game.maxPlayers,
    playingTime: liveDetails?.playingTime || game.playingTime || game.maxPlayTime,
    weight: liveDetails?.weight || game.weight,
    rating: liveDetails?.rating || game.rating,
    numRatings: liveDetails?.numRatings || null,
    rank: liveDetails?.rank || game.rank,
    categories: liveDetails?.categories?.length ? liveDetails.categories : game.categories,
    mechanics: liveDetails?.mechanics?.length ? liveDetails.mechanics : game.mechanics,
    designers: liveDetails?.designers?.length ? liveDetails.designers : game.designers,
    howToPlaySummary: liveDetails?.howToPlaySummary || null,
  };

  const imageUrl = displayData.image || displayData.thumbnail;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-start sm:items-center justify-center px-2 sm:px-4 overflow-y-auto"
          style={{
            paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 16px)',
            paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 8px), 16px)',
          }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-detail-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight:
                'calc(100dvh - max(calc(env(safe-area-inset-top, 0px) + 8px), 16px) - max(calc(env(safe-area-inset-bottom, 0px) + 8px), 16px))',
            }}
            className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-5xl flex flex-col"
          >
            {/* Sticky themed header */}
            <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-stone-950/95 backdrop-blur-sm border-b border-amber-900/40 rounded-t-2xl">
              <div className="min-w-0">
                <h2
                  id="game-detail-title"
                  className="text-xl sm:text-2xl font-serif font-bold text-amber-100 truncate"
                >
                  {displayData.name}
                </h2>
                {displayData.yearPublished && (
                  <p className="text-amber-200/60 text-[11px] sm:text-sm font-serif italic flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Published {displayData.yearPublished}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                title="Close (Esc)"
                className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg text-sm font-serif transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                {/* Image column */}
                <div className="lg:w-2/5 p-4 lg:p-6 flex flex-col items-center justify-start lg:border-r lg:border-amber-900/30">
                  <div className="relative w-full flex items-center justify-center lg:sticky lg:top-4">
                    {imageUrl && !imageError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={displayData.name}
                        className="max-h-[420px] lg:max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-lg shadow-black/40"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] max-h-[420px] bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-900/40 flex items-center justify-center rounded-lg">
                        <span className="text-7xl opacity-40">🎲</span>
                      </div>
                    )}

                    {displayData.rank && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-amber-600/95 border border-amber-400/40 rounded-md text-stone-950 text-xs font-bold shadow-md">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>#{displayData.rank}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details column */}
                <div className="lg:w-3/5 p-4 sm:p-6 lg:p-8 space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                      icon={<Users className="w-4 h-4" />}
                      label="Players"
                      value={
                        displayData.minPlayers && displayData.maxPlayers
                          ? `${displayData.minPlayers}–${displayData.maxPlayers}`
                          : 'N/A'
                      }
                    />
                    <StatCard
                      icon={<Clock className="w-4 h-4" />}
                      label="Play Time"
                      value={
                        displayData.playingTime
                          ? `${displayData.playingTime}m`
                          : 'N/A'
                      }
                    />
                    <StatCard
                      icon={<Scale className="w-4 h-4" />}
                      label="Complexity"
                      value={
                        displayData.weight
                          ? `${displayData.weight.toFixed(2)} / 5`
                          : 'N/A'
                      }
                    />
                    <StatCard
                      icon={<Star className="w-4 h-4 fill-amber-400" />}
                      label="BGG Rating"
                      value={
                        displayData.rating ? displayData.rating.toFixed(1) : 'N/A'
                      }
                      subValue={
                        displayData.numRatings
                          ? `${(displayData.numRatings / 1000).toFixed(1)}K votes`
                          : undefined
                      }
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {isOwned ? (
                      <button
                        onClick={handleRemoveFromCollection}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg font-serif font-semibold text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove from Library
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleAddToCollection}
                          disabled={isAdding}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-60 border border-amber-400/40 text-stone-950 rounded-lg font-serif font-semibold text-sm shadow-md shadow-amber-900/30 transition-colors"
                        >
                          {isAdding ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {isAdding ? 'Added!' : 'Add to Library'}
                        </button>

                        <button
                          onClick={handleToggleWishlist}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-serif font-semibold text-sm transition-colors ${
                            inWishlist
                              ? 'bg-rose-900/30 hover:bg-rose-900/50 border-rose-700/50 text-rose-200'
                              : 'bg-stone-800/70 hover:bg-stone-700/70 border-amber-900/40 text-amber-100'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              inWishlist ? 'fill-rose-300' : ''
                            }`}
                          />
                          {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        const bggIdNum = game.bggId ? parseInt(game.bggId, 10) : null;
                        if (!bggIdNum || !Number.isFinite(bggIdNum)) return;
                        window.open(`/api/rulebook/${bggIdNum}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/40 text-amber-100 rounded-lg font-serif font-semibold text-sm transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Rulebook
                    </button>

                    <button
                      onClick={() => {
                        const gameName =
                          displayData.name || game.title || 'board game';
                        window.open(
                          `https://www.amazon.com/s?k=${encodeURIComponent(
                            gameName
                          )}&tag=mrboardgame-20`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-lg font-serif font-semibold text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy on Amazon
                    </button>

                    <button
                      onClick={() => {
                        const bggId = game.bggId || game.wikidataId || '';
                        window.open(
                          `https://boardgamegeek.com/boardgame/${bggId}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif font-semibold text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on BGG
                    </button>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-serif font-semibold text-amber-200/90 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      About
                      {isLoadingDetails && (
                        <span className="flex items-center gap-1 text-[11px] normal-case tracking-normal text-amber-300/80 font-serif italic">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          loading full description…
                        </span>
                      )}
                    </h3>
                    {isLoadingDetails && !displayData.description ? (
                      <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-4 bg-stone-800/60 rounded animate-pulse"
                            style={{ width: `${100 - i * 10}%` }}
                          />
                        ))}
                      </div>
                    ) : displayData.description ? (
                      <div
                        className="text-amber-100/90 leading-relaxed font-serif text-sm sm:text-base [&_p]:mb-3 [&_em]:italic [&_strong]:font-semibold [&_strong]:text-amber-100 [&_a]:text-amber-300 [&_a:hover]:text-amber-200 [&_a:hover]:underline"
                        dangerouslySetInnerHTML={{
                          __html:
                            displayData.description.length > 2000
                              ? displayData.description.slice(0, 2000) + '…'
                              : displayData.description,
                        }}
                      />
                    ) : (
                      <p className="text-stone-400 italic font-serif">
                        No description available.
                      </p>
                    )}
                  </div>

                  {/* How to play */}
                  {displayData.howToPlaySummary && (
                    <div className="bg-stone-950/60 border border-amber-900/40 rounded-xl p-4">
                      <h3 className="text-xs font-serif font-semibold text-amber-200/90 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        Quick Overview
                      </h3>
                      <p className="text-amber-100/90 text-sm leading-relaxed font-serif">
                        {displayData.howToPlaySummary}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayData.categories &&
                      displayData.categories.length > 0 && (
                        <div>
                          <h3 className="text-[11px] font-serif font-semibold text-amber-200/70 uppercase tracking-wider mb-2">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {displayData.categories.slice(0, 6).map((cat, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-100 text-xs rounded-lg font-serif"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {displayData.mechanics &&
                      displayData.mechanics.length > 0 && (
                        <div>
                          <h3 className="text-[11px] font-serif font-semibold text-amber-200/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Mechanics
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {displayData.mechanics.slice(0, 6).map((mech, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-stone-800/70 border border-amber-900/50 text-amber-100 text-xs rounded-lg font-serif"
                              >
                                {mech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Designers */}
                  {displayData.designers &&
                    displayData.designers.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-serif font-semibold text-amber-200/70 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <User className="w-3 h-3" /> Designed by
                        </h3>
                        <p className="text-amber-100 font-serif text-sm">
                          {displayData.designers.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="p-3 rounded-xl border border-amber-900/40 bg-stone-950/60">
      <div className="text-amber-400 mb-1.5">{icon}</div>
      <p className="text-[10px] text-amber-200/60 uppercase tracking-wider font-serif">
        {label}
      </p>
      <p className="text-base font-bold font-serif text-amber-100 leading-tight">
        {value}
      </p>
      {subValue && (
        <p className="text-[10px] text-stone-500 mt-0.5 font-serif italic">
          {subValue}
        </p>
      )}
    </div>
  );
}
