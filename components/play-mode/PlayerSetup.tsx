'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { Player } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface PlayerSetupProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  gameAttributes?: string[]; // e.g., ['role', 'class', 'race']
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
      ...Object.fromEntries(gameAttributes.map(attr => [attr, ''])),
    };

    onPlayersChange([...players, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    onPlayersChange(
      players.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-6 h-6 text-purple-500" />
        <h2 className="text-xl font-bold font-display text-gray-900">Setup Players</h2>
      </div>

      {/* Add Player */}
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
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
        />
        <button
          onClick={addPlayer}
          disabled={!newPlayerName.trim()}
          className="px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-xl transition-all flex items-center gap-2 font-ui font-semibold hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-purple-200"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </div>

      {/* Player List */}
      <AnimatePresence>
        <div className="space-y-3">
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-semibold font-ui focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                />
                <button
                  onClick={() => removePlayer(player.id)}
                  className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all text-red-500 hover:text-red-600 hover:scale-110 active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Game-specific attributes */}
              {gameAttributes.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {gameAttributes.map((attr) => (
                    <div key={attr}>
                      <label className="block text-xs text-gray-500 mb-1.5 capitalize font-ui font-medium">
                        {attr}
                      </label>
                      <input
                        type="text"
                        value={player[attr] || ''}
                        onChange={(e) =>
                          updatePlayer(player.id, { [attr]: e.target.value })
                        }
                        placeholder={`Enter ${attr}...`}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm font-ui focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-gray-400"
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
        <div className="text-center py-10 text-gray-500">
          <UserPlus className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="font-ui text-lg">Add players to get started</p>
        </div>
      )}
    </div>
  );
}
