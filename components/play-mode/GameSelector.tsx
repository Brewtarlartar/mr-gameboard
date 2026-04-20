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

export default function GameSelector({
  onSelectGame,
  selectedGame,
}: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { games } = useGameStore();

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg shadow-black/30">
      <h2 className="text-lg font-serif font-bold text-amber-100 tracking-wide">
        Choose a Game
      </h2>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/70 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search thy library..."
          className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 placeholder:text-amber-200/40 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
        />
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-12 text-amber-200/60">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-serif italic">
            {searchQuery
              ? 'No tomes match thy search'
              : 'Thy library is empty. Add a game to begin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide">
          {filteredGames.map((game) => {
            const isSelected = selectedGame?.id === game.id;
            const artUrl = game.thumbnail || game.image;
            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`group p-3 rounded-xl border transition-colors text-left ${
                  isSelected
                    ? 'border-amber-500/60 bg-amber-500/10 shadow-md shadow-amber-900/20'
                    : 'border-amber-900/40 bg-stone-900/60 hover:border-amber-700/60 hover:bg-stone-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {artUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-amber-900/40 bg-stone-950">
                      <Image
                        src={artUrl}
                        alt={game.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-stone-900 border border-amber-900/40 flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-6 h-6 text-amber-400/70" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-serif font-semibold truncate transition-colors ${
                        isSelected
                          ? 'text-amber-200'
                          : 'text-amber-100 group-hover:text-amber-200'
                      }`}
                    >
                      {game.name}
                    </div>
                    <div className="text-xs text-amber-200/60 font-serif italic">
                      {game.minPlayers && game.maxPlayers
                        ? `${game.minPlayers}-${game.maxPlayers} players`
                        : ''}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
