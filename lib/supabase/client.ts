import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient, type SupabaseClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// In the Capacitor shell (NEXT_PUBLIC_CAPACITOR_BUILD=1, statically inlined so
// the other branch is dead code in each bundle) the cookie-based @supabase/ssr
// browser client is unusable: it persists sessions exclusively via
// document.cookie, which is unreliable on the capacitor:// scheme and pointless
// without a same-origin server. The native build uses plain supabase-js with a
// Capacitor Preferences storage adapter instead; PKCE flow, no URL detection
// (the OAuth code arrives via deep link and is exchanged explicitly).
const capacitorStorage = {
  getItem: async (key: string) => (await Preferences.get({ key })).value,
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

let nativeClient: SupabaseClient | null = null;

export const createClient = () => {
  if (process.env.NEXT_PUBLIC_CAPACITOR_BUILD === '1') {
    if (!nativeClient) {
      nativeClient = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          auth: {
            storage: capacitorStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
          },
        },
      );
    }
    return nativeClient;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
};

// Database types (auto-generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          is_pro: boolean;
          pro_expires_at: string | null;
        };
      };
      games: {
        Row: {
          id: string;
          user_id: string;
          bgg_id: number;
          name: string;
          image: string | null;
          data: any;
          is_favorite: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          bgg_id: number;
          name: string;
          image?: string | null;
          data: any;
          is_favorite?: boolean;
        };
      };
      play_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          date: string;
          duration: number;
          players: any;
          notes: string | null;
          rating: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          date: string;
          duration: number;
          players: any;
          notes?: string | null;
          rating?: number | null;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          xp: number;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          title: string;
          content: string;
          category: string;
          rating: number;
          upvotes: number;
          created_at: string;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          game_data: any;
          priority: string;
          notes: string | null;
          created_at: string;
        };
      };
      game_nights: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          location: string | null;
          players: any;
          suggested_games: any;
          votes: any;
          status: string;
          created_at: string;
        };
      };
      bgg_games_cache: {
        Row: {
          bgg_id: number;
          name: string;
          description: string | null;
          image: string | null;
          thumbnail: string | null;
          min_players: number | null;
          max_players: number | null;
          playing_time: number | null;
          min_playing_time: number | null;
          max_playing_time: number | null;
          complexity: number | null;
          rating: number | null;
          year_published: number | null;
          rank: number | null;
          categories: string[];
          mechanics: string[];
          designers: string[];
          artists: string[];
          publishers: string[];
          created_at: string;
          last_synced_at: string;
        };
      };
      bgg_sync_log: {
        Row: {
          id: string;
          started_at: string;
          completed_at: string | null;
          status: 'running' | 'completed' | 'failed' | 'partial';
          games_synced: number;
          games_failed: number;
          error_message: string | null;
          details: any;
        };
      };
      // Added by supabase/migrations/0001_accounts_and_sync.sql
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
      };
      library_games: {
        Row: {
          user_id: string;
          game_id: string;
          data: any;
          is_favorite: boolean;
          added_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          data: any;
          is_favorite?: boolean;
        };
      };
      custom_games: {
        Row: {
          user_id: string;
          id: string;
          data: any;
          created_at: string;
        };
        Insert: {
          user_id: string;
          id: string;
          data: any;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          preferences: any;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferences: any;
        };
      };
    };
  };
};

