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
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { isGameOwned, addGameFromSeed, removeGame } = useGameStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  const isOwned = game ? isGameOwned(game.bggId) : false;
  const inWishlist = game ? isInWishlist(game.bggId) : false;

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Fetch live details when modal opens
  useEffect(() => {
    if (isOpen && game?.bggId) {
      fetchLiveGameDetails(game.bggId);
    }
    
    // Reset state when closing
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }

      const data = await response.json();
      console.log('[GameDetailModal] Received live details:', {
        id: data.id,
        name: data.name,
        descriptionLength: data.description?.length || 0,
        descriptionPreview: data.description?.substring(0, 200) || 'NO DESCRIPTION'
      });
      setLiveDetails(data);
    } catch (error) {
      console.error('Error fetching live details:', error);
      setDetailsError('Could not load additional details from BGG');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddToCollection = async () => {
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
    // Close modal after removing
    onClose();
  };

  const handleToggleWishlist = () => {
    if (!game) return;
    
    if (inWishlist) {
      // Find the wishlist item by bggId and remove it
      const wishlistItem = useWishlistStore.getState().wishlist.find(
        item => item.game.bggId === game.bggId
      );
      if (wishlistItem) {
        removeFromWishlist(wishlistItem.id);
      }
    } else {
      addToWishlist(game);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!game) return null;

  // Merge local data with live data
  // IMPORTANT: Prioritize live details over seed data
  console.log('[GameDetailModal] Merging data:', {
    hasLiveDetails: !!liveDetails,
    liveDescriptionLength: liveDetails?.description?.length || 0,
    seedDescriptionLength: game.description?.length || 0,
    willUseLiveDescription: !!(liveDetails?.description)
  });
  
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
    comments: liveDetails?.comments || [],
    howToPlaySummary: liveDetails?.howToPlaySummary || null,
  };

  const imageUrl = displayData.image || displayData.thumbnail;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - very high z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={onClose}
          />

          {/* Modal - highest z-index */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={onClose}
          >
            <div 
              className="bg-white border border-gray-200 rounded-2xl w-full h-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
              </button>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col lg:flex-row min-h-full">
                  {/* Left Side - Image (Full box art visible, no effects) */}
                  <div className="lg:w-2/5 flex flex-col items-center justify-start p-4 lg:p-6">
                    {/* Main image - clean, no cropping */}
                    <div className="relative w-full flex items-center justify-center lg:sticky lg:top-6">
                      {imageUrl && !imageError ? (
                        <img
                          src={imageUrl}
                          alt={displayData.name}
                          className="max-h-[500px] w-auto max-w-full object-contain"
                          onError={() => {
                            console.log(`[GameDetailModal] Image failed to load: ${imageUrl}`);
                            setImageError(true);
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] max-h-[500px] bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center rounded-lg">
                          <span className="text-8xl opacity-30">🎲</span>
                        </div>
                      )}
                      
                      {/* Rank Badge */}
                      {displayData.rank && (
                        <div className="absolute top-2 left-2 flex items-center gap-2 px-3 py-2 bg-amber-500/90 rounded-lg">
                          <Trophy className="w-4 h-4 text-amber-900" />
                          <span className="text-amber-900 font-bold">#{displayData.rank}</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile Title Overlay */}
                    <div className="w-full p-4 lg:hidden">
                      <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">{displayData.name}</h1>
                      {displayData.yearPublished && (
                        <p className="text-gray-400 text-center">({displayData.yearPublished})</p>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Details */}
                  <div className="lg:w-3/5 p-6 lg:p-8 space-y-6">
                    {/* Desktop Title */}
                    <div className="hidden lg:block">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">{displayData.name}</h1>
                      {displayData.yearPublished && (
                        <p className="text-gray-400 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Published {displayData.yearPublished}
                        </p>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={<Users className="w-5 h-5" />}
                        label="Players"
                        value={
                          displayData.minPlayers && displayData.maxPlayers
                            ? `${displayData.minPlayers}–${displayData.maxPlayers}`
                            : 'N/A'
                        }
                        color="cyan"
                      />
                      <StatCard
                        icon={<Clock className="w-5 h-5" />}
                        label="Play Time"
                        value={displayData.playingTime ? `${displayData.playingTime} min` : 'N/A'}
                        color="emerald"
                      />
                      <StatCard
                        icon={<Scale className="w-5 h-5" />}
                        label="Complexity"
                        value={displayData.weight ? `${displayData.weight.toFixed(2)} / 5` : 'N/A'}
                        color="orange"
                      />
                      <StatCard
                        icon={<Star className="w-5 h-5" />}
                        label="BGG Rating"
                        value={displayData.rating ? displayData.rating.toFixed(1) : 'N/A'}
                        subValue={displayData.numRatings ? `${(displayData.numRatings / 1000).toFixed(1)}K votes` : undefined}
                        color="yellow"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {isOwned ? (
                        <button
                          onClick={handleRemoveFromCollection}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove from Collection
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleAddToCollection}
                            disabled={isAdding}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50"
                          >
                            {isAdding ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                            {isAdding ? 'Added!' : 'Add to Collection'}
                          </button>
                          
                          {/* Wishlist Button */}
                          <button
                            onClick={handleToggleWishlist}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all border ${
                              inWishlist
                                ? 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-600'
                                : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-pink-500' : ''}`} />
                            {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                          </button>
                        </>
                      )}

                      {/* Amazon Affiliate Button - ALWAYS visible (revenue source) */}
                      <button
                        onClick={() => {
                          const gameName = displayData.name || game.title || 'board game';
                          window.open(`https://www.amazon.com/s?k=${encodeURIComponent(gameName)}&tag=mrboardgame-20`, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Buy on Amazon
                      </button>
                      
                      {/* BGG Attribution Link - Required for using BGG data */}
                      <button
                        onClick={() => {
                          const bggId = game.bggId || game.wikidataId || '';
                          window.open(`https://boardgamegeek.com/boardgame/${bggId}`, '_blank');
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-gray-50 border border-gray-300 text-gray-500 hover:text-gray-900 text-sm rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                        View on BGG
                      </button>
                    </div>

                    {/* Description - Rendered as HTML */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        About
                        {isLoadingDetails && (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            <span className="text-xs text-purple-500 font-normal">Loading full description...</span>
                          </>
                        )}
                        {liveDetails?.description && !isLoadingDetails && (
                          <span className="text-xs text-green-400 font-normal">✓ Full BGG description</span>
                        )}
                      </h2>
                      {isLoadingDetails && !displayData.description ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        </div>
                      ) : displayData.description ? (
                        <div 
                          className="text-gray-700 leading-relaxed space-y-4 [&>p]:mb-4 [&>em]:italic [&>strong]:font-semibold [&>a]:text-purple-600 [&>a:hover]:underline [&_a]:text-purple-600 [&_a:hover]:underline [&_p]:mb-4 [&_em]:italic [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{ 
                            __html: displayData.description.length > 2000
                              ? displayData.description.slice(0, 2000) + '...'
                              : displayData.description 
                          }}
                        />
                      ) : (
                        <p className="text-gray-500 italic">No description available.</p>
                      )}
                    </div>

                    {/* How to Play Summary */}
                    {displayData.howToPlaySummary && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Quick Overview
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {displayData.howToPlaySummary}
                        </p>
                      </div>
                    )}

                    {/* Categories & Mechanics */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {displayData.categories && displayData.categories.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {displayData.categories.slice(0, 6).map((cat, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded-lg"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {displayData.mechanics && displayData.mechanics.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Mechanics
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {displayData.mechanics.slice(0, 6).map((mech, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-600 text-xs rounded-lg"
                              >
                                {mech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Designers */}
                    {displayData.designers && displayData.designers.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <User className="w-3 h-3" /> Designed by
                        </h3>
                        <p className="text-gray-700">
                          {displayData.designers.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render via portal to ensure modal is above all other content
  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: 'cyan' | 'emerald' | 'orange' | 'yellow';
}) {
  const colors = {
    cyan: 'text-purple-600 bg-purple-50 border-purple-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className={`${colors[color].split(' ')[0]} mb-2`}>{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  );
}

