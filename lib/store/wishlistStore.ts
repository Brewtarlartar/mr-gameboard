import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SeedGame } from '@/types/seedGame';

export interface WishlistItem {
  id: string;
  game: SeedGame;
  addedAt: Date;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  targetPrice?: number;
}

interface WishlistStore {
  wishlist: WishlistItem[];
  
  // Actions
  addToWishlist: (game: SeedGame, priority?: 'low' | 'medium' | 'high') => void;
  removeFromWishlist: (id: string) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  isInWishlist: (bggId: string) => boolean;
  getWishlistByPriority: (priority: 'low' | 'medium' | 'high') => WishlistItem[];
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlist: [],

      addToWishlist: (game, priority = 'medium') => {
        const existing = get().wishlist.find(item => item.game.bggId === game.bggId);
        if (existing) return; // Already in wishlist

        const newItem: WishlistItem = {
          id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          game,
          addedAt: new Date(),
          priority,
        };

        set(state => ({
          wishlist: [...state.wishlist, newItem],
        }));
      },

      removeFromWishlist: (id) => {
        set(state => ({
          wishlist: state.wishlist.filter(item => item.id !== id),
        }));
      },

      updateWishlistItem: (id, updates) => {
        set(state => ({
          wishlist: state.wishlist.map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      isInWishlist: (bggId) => {
        return get().wishlist.some(item => item.game.bggId === bggId);
      },

      getWishlistByPriority: (priority) => {
        return get().wishlist.filter(item => item.priority === priority);
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);

