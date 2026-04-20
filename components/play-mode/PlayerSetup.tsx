'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { Player } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerSetupProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  gameAttributes?: string[];
}

export default function PlayerSetup({
  players,
  onPlayersChange,
  gameAttributes = [],
}: PlayerSetupProps) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      ...Object.fromEntries(gameAttributes.map((attr) => [attr, ''])),
    };

    onPlayersChange([...players, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    onPlayersChange(
      players.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  return (
    <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg shadow-black/30">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-serif font-bold text-amber-100 tracking-wide">
          Gather the Fellowship
        </h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addPlayer();
            }
          }}
          placeholder="Enter player name..."
          className="flex-1 px-3.5 py-2.5 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 placeholder:text-amber-200/40 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
        />
        <button
          onClick={addPlayer}
          disabled={!newPlayerName.trim()}
          className="px-4 py-2.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 font-serif font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-amber-500 disabled:hover:to-amber-700"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <AnimatePresence>
        <div className="space-y-2.5">
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-3.5 bg-stone-900/60 border border-amber-900/40 rounded-xl hover:border-amber-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) =>
                    updatePlayer(player.id, { name: e.target.value })
                  }
                  className="flex-1 px-3 py-2 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 font-serif font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
                />
                <button
                  onClick={() => removePlayer(player.id)}
                  className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-colors text-stone-400 hover:text-red-400"
                  aria-label={`Remove ${player.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {gameAttributes.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {gameAttributes.map((attr) => (
                    <div key={attr}>
                      <label className="block text-[10px] text-amber-200/60 mb-1 capitalize font-serif uppercase tracking-wider">
                        {attr}
                      </label>
                      <input
                        type="text"
                        value={player[attr] || ''}
                        onChange={(e) =>
                          updatePlayer(player.id, { [attr]: e.target.value })
                        }
                        placeholder={`Enter ${attr}...`}
                        className="w-full px-2.5 py-1.5 bg-stone-950/70 border border-amber-900/40 rounded-md text-amber-100 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors placeholder:text-amber-200/30"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {players.length === 0 && (
        <div className="text-center py-10 text-amber-200/60">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-serif italic">Add players to begin the session</p>
        </div>
      )}
    </div>
  );
}
