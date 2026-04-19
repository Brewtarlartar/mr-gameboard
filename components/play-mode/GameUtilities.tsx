'use client';

import { useState } from 'react';
import { Dice1, Trophy, Timer, Wrench } from 'lucide-react';
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
    <div className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Utilities</h3>
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-stone-900/60 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-amber-500 text-stone-900 shadow'
                  : 'text-stone-300 hover:text-stone-100'
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
