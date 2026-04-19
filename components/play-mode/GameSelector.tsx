'use client';

import { useState } from 'react';
import { Search, Gamepad2 } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';
import Image from 'next/image';

interface GameSelectorProps {
  onSelectGame: (game: Game) => void;
  selectedGame: Game | null;
}

export default function GameSelector({ onSelectGame, selectedGame }: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { games } = useGameStore();

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Gamepad2 className="w-6 h-6 text-purple-500" />
        <h2 className="text-xl font-bold font-display text-gray-900">Select Game</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your library..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
        />
      </div>

      {/* Game List */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">
            {searchQuery ? 'No games found' : 'No games in your library. Add some games first!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-hide">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className={`group p-4 rounded-xl border-2 transition-all text-left ${
                selectedGame?.id === game.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                  : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                {game.thumbnail ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                      src={game.thumbnail}
                      alt={game.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                    <Gamepad2 className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                    {game.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {game.minPlayers && game.maxPlayers
                      ? `${game.minPlayers}-${game.maxPlayers} players`
                      : ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
