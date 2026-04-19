'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, Star, Users, Clock, ChevronDown, ChevronUp, Sparkles, Home, Target, Trophy, Heart } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { SeedGame } from '@/types/seedGame';
import GameDetailModal from './GameDetailModal';

// Fallback images for popular games with known broken URLs
const FALLBACK_IMAGES: Record<string, string> = {
  '13': 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__original/img/xV7oisd3RQ8R-k18cdWAYthHXsA=/0x0/filters:format(jpeg)/pic2419375.jpg', // Catan
  '822': 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__original/img/5aNojpjdSrVg8rRvHiGpg8_Jj1g=/0x0/filters:format(jpeg)/pic1534148.jpg', // Carcassonne
  '36218': 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__original/img/75xcxJPIvf-HJJkXc2_W-7na6bs=/0x0/filters:format(jpeg)/pic2582929.jpg', // Dominion
};

type CategoryKey = 'top500' | 'party' | 'family' | 'strategy';

interface CategoryConfig {
  key: CategoryKey;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgGradient: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'top500',
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-amber-600',
    borderColor: 'border-amber-300',
    bgGradient: 'from-amber-50 to-white',
  },
  {
    key: 'party',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-pink-600',
    borderColor: 'border-pink-300',
    bgGradient: 'from-pink-50 to-white',
  },
  {
    key: 'family',
    icon: <Home className="w-5 h-5" />,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    bgGradient: 'from-emerald-50 to-white',
  },
  {
    key: 'strategy',
    icon: <Target className="w-5 h-5" />,
    color: 'text-blue-600',
    borderColor: 'border-blue-300',
    bgGradient: 'from-blue-50 to-white',
  },
];

export default function DiscoverGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<CategoryKey>>(new Set());
  const [addingGameId, setAddingGameId] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<SeedGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    discoverCategories,
    discoverLoaded, 
    loadDiscoverGames, 
    addGameFromSeed,
    isGameOwned 
  } = useGameStore();
  
  const { addToWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    loadDiscoverGames();
  }, [loadDiscoverGames]);

  const toggleCategory = (key: CategoryKey) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const collapseCategory = (key: CategoryKey) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    // Scroll to the accordion header
    document.getElementById(`accordion-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Filter games by search query across all categories
  const filterGames = (games: SeedGame[]) => {
    if (!searchQuery.trim()) return games;
    
    const query = searchQuery.toLowerCase();
    return games.filter(game => 
      game.title.toLowerCase().includes(query) ||
      game.categories?.some(c => c.toLowerCase().includes(query)) ||
      game.mechanics?.some(m => m.toLowerCase().includes(query)) ||
      game.designers?.some(d => d.toLowerCase().includes(query))
    );
  };

  const handleAddGame = async (game: SeedGame, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
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
    e.stopPropagation(); // Prevent opening modal
    addToWishlist(game);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing the game to allow exit animation
    setTimeout(() => setSelectedGame(null), 300);
  };

  if (!discoverLoaded) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-500" />
          Discover Games
        </h2>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!discoverCategories) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-purple-500 animate-pulse" />
            <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text">
              Discover Games
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all categories..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Accordions */}
        <div className="space-y-3">
          {CATEGORY_CONFIGS.map((config) => {
            const category = discoverCategories[config.key];
            if (!category) return null;

            const filteredGames = filterGames(category.games);
            const isOpen = openCategories.has(config.key);
            const hasResults = filteredGames.length > 0;

            return (
              <div
                key={config.key}
                id={`accordion-${config.key}`}
                className={`rounded-xl border ${config.borderColor} overflow-hidden transition-all duration-300`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(config.key)}
                  className={`w-full px-6 py-5 bg-gradient-to-r ${config.bgGradient} flex items-center justify-between hover:brightness-110 transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${config.color} transform transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
                      {config.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 font-bold text-xl">{category.name}</h3>
                        {config.key === 'top500' && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-200 font-semibold">
                            BGG Top 500
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm font-medium">
                        {searchQuery && hasResults
                          ? `${filteredGames.length} matches`
                          : `${category.count} games`}
                      </p>
                    </div>
                  </div>
                  <div className={`${config.color} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-6 h-6" />
                  </div>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="relative bg-gray-50 p-4">
                    {!hasResults ? (
                      <p className="text-center text-gray-400 py-8">
                        No games match your search in this category
                      </p>
                    ) : (
                      <>
                        {/* Games Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {filteredGames.map((game) => (
                            <GameDiscoverCard
                              key={game.bggId}
                              game={game}
                              isOwned={isGameOwned(game.bggId)}
                              inWishlist={isInWishlist(game.bggId)}
                              isAdding={addingGameId === game.bggId}
                              onAdd={(e) => handleAddGame(game, e)}
                              onAddToWishlist={(e) => handleAddToWishlist(game, e)}
                              onClick={() => handleCardClick(game)}
                            />
                          ))}
                        </div>

                        {/* Sticky Collapse Button at Bottom */}
                        <div className="sticky bottom-0 left-0 right-0 mt-6 pt-4 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent">
                          <button
                            onClick={() => collapseCategory(config.key)}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 border ${config.borderColor} rounded-lg transition-all group shadow-sm`}
                          >
                            <ChevronUp className={`w-4 h-4 ${config.color} group-hover:-translate-y-0.5 transition-transform`} />
                            <span className="text-gray-700">Collapse {category.name}</span>
                            <ChevronUp className={`w-4 h-4 ${config.color} group-hover:-translate-y-0.5 transition-transform`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

// Individual game card component with 2-layer premium look
function GameDiscoverCard({
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
  
  // Check for fallback image if original fails
  const fallbackImage = game.bggId ? FALLBACK_IMAGES[game.bggId] : undefined;
  
  // Prioritize high-res image, fall back to thumbnail, then to known fallbacks
  const imageUrl = imageError && fallbackImage 
    ? fallbackImage 
    : (game.image || game.thumbnail);
  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !(imageError && !fallbackImage);

  return (
    <div 
      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-200/40 cursor-pointer"
      onClick={onClick}
    >
      {/* 2-Layer Premium Image */}
      {hasValidImage ? (
        <>
          {/* Layer 1: Blurred background fills empty space */}
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-lg opacity-50 scale-110"
            loading="lazy"
          />
          
          {/* Layer 2: Full box art, no cropping */}
          <img
            src={imageUrl}
            alt={game.title}
            className="relative w-full h-full object-contain z-[1]"
            onError={(e) => {
              // If we haven't tried the fallback yet, try it
              if (!imageError && fallbackImage) {
                setImageError(true);
                (e.target as HTMLImageElement).src = fallbackImage;
              } else {
                setImageError(true);
              }
            }}
            loading="lazy"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center">
          <span className="text-4xl opacity-30">🎲</span>
        </div>
      )}

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-[2]" />

      {/* Rank Badge */}
      {game.rank && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600/90 rounded-md text-xs font-bold text-white z-[5]">
          #{game.rank}
        </div>
      )}

      {/* Add/Owned Button */}
      <div className="absolute top-2 right-2 flex gap-1 z-[5]">
        <button
          onClick={onAdd}
          disabled={isOwned || isAdding}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isOwned
              ? 'bg-green-500/90 text-white cursor-default'
              : isAdding
              ? 'bg-purple-500 text-white animate-pulse'
              : 'bg-purple-500 hover:bg-purple-400 text-white hover:scale-110'
          }`}
          title={isOwned ? 'In Library' : 'Add to Library'}
        >
          {isOwned ? (
            <Check className="w-4 h-4" />
          ) : isAdding ? (
            <Plus className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
        
        {/* Wishlist Button */}
        {!isOwned && (
          <button
            onClick={onAddToWishlist}
            disabled={inWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              inWishlist
                ? 'bg-pink-500/90 text-white cursor-default'
                : 'bg-white/90 hover:bg-pink-500/90 text-gray-400 hover:text-white hover:scale-110'
            }`}
            title={inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-pink-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-[3]">
        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
          {game.title}
        </h3>
        
        {game.yearPublished && (
          <p className="text-gray-400 text-xs mb-2">({game.yearPublished})</p>
        )}

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {game.minPlayers && game.maxPlayers && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{game.minPlayers}-{game.maxPlayers}</span>
            </div>
          )}
          {(game.playingTime || game.maxPlayTime) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{game.playingTime || game.maxPlayTime}m</span>
            </div>
          )}
          {game.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Click to View Label (on hover) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[4]">
        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium">
          Click for details
        </span>
      </div>
    </div>
  );
}
