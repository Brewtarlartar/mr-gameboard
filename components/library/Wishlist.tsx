'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, Star, DollarSign, AlertCircle, Users, Clock, TrendingUp, Search, X } from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useGameStore } from '@/lib/store/gameStore';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, updateWishlistItem } = useWishlistStore();
  const { addGameFromSeed, isGameOwned } = useGameStore();
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWishlist = selectedPriority === 'all'
    ? wishlist
    : wishlist.filter(item => item.priority === selectedPriority);

  // Apply search filter
  const searchFilteredWishlist = searchQuery.trim()
    ? filteredWishlist.filter(item => 
        item.game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.game.categories?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.game.mechanics?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.game.designers?.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredWishlist;

  const priorityColors = {
    low: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
    medium: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    high: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  };

  if (wishlist.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
        <Heart className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h3>
        <p className="text-gray-500">
          Start adding games you want to your wishlist from the Discover section!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text">Wishlist</h2>
            <p className="text-gray-500 mt-1">
              {wishlist.length} games you want to own
              {searchQuery && searchFilteredWishlist.length !== wishlist.length && (
                <span className="ml-2 text-purple-600">
                  • {searchFilteredWishlist.length} matches
                </span>
              )}
            </p>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            {['all', 'high', 'medium', 'low'].map((priority) => (
              <button
                key={priority}
                onClick={() => setSelectedPriority(priority as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPriority === priority
                    ? 'bg-purple-50 text-purple-600 border border-purple-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wishlist by title, category, mechanic, or designer..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchFilteredWishlist.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery 
                ? `No games match "${searchQuery}"`
                : 'No games match the selected priority'}
            </p>
          </div>
        ) : (
          searchFilteredWishlist.map((item, index) => {
          const isOwned = isGameOwned(item.game.bggId);
          const colors = priorityColors[item.priority];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-4 ${isOwned ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div className="relative w-full aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gray-100">
                {item.game.image || item.game.thumbnail ? (
                  <img
                    src={item.game.image || item.game.thumbnail || ''}
                    alt={item.game.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl opacity-40">🎲</span>
                  </div>
                )}

                {/* Priority Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-2xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {item.priority.toUpperCase()}
                </div>

                {/* Owned Badge */}
                {isOwned && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-2xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    OWNED
                  </div>
                )}
              </div>

              {/* Game Info */}
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{item.game.title}</h3>

              <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                {item.game.minPlayers && item.game.maxPlayers && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{item.game.minPlayers}-{item.game.maxPlayers}</span>
                  </div>
                )}
                {item.game.playingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.game.playingTime}m</span>
                  </div>
                )}
                {item.game.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{item.game.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">{item.notes}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!isOwned && (
                  <button
                    onClick={() => {
                      addGameFromSeed(item.game);
                      removeFromWishlist(item.id);
                    }}
                    className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 rounded-lg text-xs font-semibold transition-all"
                  >
                    Add to Library
                  </button>
                )}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Priority Selector */}
              <div className="mt-3 flex gap-1">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => updateWishlistItem(item.id, { priority })}
                    className={`flex-1 px-2 py-1 rounded text-2xs font-bold transition-all ${
                      item.priority === priority
                        ? `${priorityColors[priority].bg} ${priorityColors[priority].text} border ${priorityColors[priority].border}`
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })
      )}
      </div>
    </div>
  );
}

