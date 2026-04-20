'use client';

import { useState } from 'react';
import { Dice1, Trophy, Timer } from 'lucide-react';
import DiceRoller from './DiceRoller';
import ScoreTracker from './ScoreTracker';
import TurnTimer from './TurnTimer';
import { Game } from '@/types/game';

interface GameUtilitiesProps {
  game?: Game | null;
  playerNames?: string[];
}

export default function GameUtilities({ game, playerNames }: GameUtilitiesProps = {}) {
  const [activeTab, setActiveTab] = useState<'dice' | 'score' | 'timer'>('score');

  const tabs = [
    { id: 'score' as const, label: 'Score', icon: Trophy },
    { id: 'dice' as const, label: 'Dice', icon: Dice1 },
    { id: 'timer' as const, label: 'Timer', icon: Timer },
  ];

  return (
    <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-4 shadow-lg shadow-black/30">
      <h3 className="text-xs font-serif font-semibold text-amber-200 uppercase tracking-wider mb-4">
        Utilities
      </h3>

      <div className="flex gap-1 mb-4 p-1 bg-stone-950/70 border border-amber-900/40 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-serif font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border border-amber-400/40 shadow-md shadow-amber-900/30'
                  : 'text-amber-100/80 hover:text-amber-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[240px]">
        {activeTab === 'dice' && <DiceRoller />}
        {activeTab === 'score' && <ScoreTracker game={game} initialPlayers={playerNames} />}
        {activeTab === 'timer' && <TurnTimer />}
      </div>
    </div>
  );
}
