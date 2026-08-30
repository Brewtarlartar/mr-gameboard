'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Users } from 'lucide-react';
import { Game } from '@/types/game';
import { useHapticFeedback } from '@/lib/hooks/useMobile';
import WizardChatModal from '@/components/ai/WizardChatModal';
import ScoreTracker from './ScoreTracker';

interface PlayModeAssistantProps {
  game: Game;
  players: string[];
  onComplete?: () => void;
}

/**
 * The DURING-the-game main stage: the score sheet front and center, with the
 * Sage one tap away for rules disputes. (This replaced a generic five-phase
 * walker that showed identical hardcoded "phases" for every game.)
 */
export default function PlayModeAssistant({
  game,
  players,
  onComplete,
}: PlayModeAssistantProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const haptic = useHapticFeedback();

  const roster = players.length > 0 ? players.join(', ') : 'the table';
  const wizardGameContext = `The user is mid-game playing ${game.name} with ${players.length} player${
    players.length === 1 ? '' : 's'
  } (${roster}). Answer their question in the context of this game.`;

  return (
    <div className="space-y-5">
      {/* Game header */}
      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-serif font-bold text-amber-100 truncate">{game.name}</h3>
          <span className="flex items-center gap-1.5 text-xs text-amber-200/70 font-serif italic flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
            {roster}
          </span>
        </div>
      </div>

      {/* Score sheet — the main stage while playing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/30"
      >
        <ScoreTracker game={game} />
      </motion.div>

      {/* Ask the Sage — rules disputes, settled with the game context attached */}
      <button
        onClick={() => {
          haptic.medium();
          setWizardOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900/60 hover:bg-stone-900/80 border border-amber-900/40 hover:border-amber-700/60 rounded-xl transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-amber-300" />
        <span className="font-serif font-semibold text-amber-200 text-sm">
          Ask the Sage a Question
        </span>
      </button>

      {/* Complete */}
      <button
        onClick={() => {
          haptic.success();
          onComplete?.();
        }}
        className="w-full bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 rounded-lg px-5 py-2.5 font-serif font-semibold flex items-center justify-center gap-2 shadow-md shadow-amber-900/30 transition-colors"
      >
        Complete Game
        <CheckCircle className="w-4 h-4" />
      </button>

      <WizardChatModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        gameContext={wizardGameContext}
        bggId={game.bggId}
        gameName={game.name}
      />
    </div>
  );
}
