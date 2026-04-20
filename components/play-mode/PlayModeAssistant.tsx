'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  MessageSquare,
  Clock,
  Users,
  Flag,
  Flame,
} from 'lucide-react';
import { Game } from '@/types/game';
import { useHapticFeedback } from '@/lib/hooks/useMobile';
import WizardChatModal from '@/components/ai/WizardChatModal';

interface PlayModeAssistantProps {
  game: Game;
  players: string[];
  onComplete?: () => void;
}

export default function PlayModeAssistant({
  game,
  players,
  onComplete,
}: PlayModeAssistantProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const haptic = useHapticFeedback();

  const phases = generateGamePhases(game, players.length);

  const handleNextPhase = () => {
    haptic.success();
    if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevPhase = () => {
    haptic.light();
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const progress = ((currentPhase + 1) / phases.length) * 100;

  const currentPhaseInfo = phases[currentPhase];
  const roster = players.length > 0 ? players.join(', ') : 'the table';
  const wizardGameContext = `The user is mid-game playing ${game.name} with ${players.length} player${
    players.length === 1 ? '' : 's'
  } (${roster}). They are currently in the "${currentPhaseInfo.title}" phase — ${currentPhaseInfo.subtitle}. Answer their question in the context of this game and this stage.`;

  return (
    <div className="space-y-5">
      {/* Progress Header */}
      <div className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/30">
        <div className="flex items-center justify-between mb-3 gap-4">
          <h3 className="text-xl font-serif font-bold text-amber-100 truncate">
            {game.name}
          </h3>
          <span className="text-xs text-amber-200/70 font-serif italic flex-shrink-0">
            Phase {currentPhase + 1} of {phases.length}
          </span>
        </div>
        <div className="relative h-1.5 bg-stone-950/80 border border-amber-900/40 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-3 gap-2">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => {
                haptic.light();
                setCurrentPhase(index);
              }}
              className={`text-[11px] font-serif transition-colors ${
                index <= currentPhase
                  ? 'text-amber-300'
                  : 'text-amber-200/40 hover:text-amber-200/70'
              }`}
            >
              {phase.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Current Phase */}
      <motion.div
        key={currentPhase}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/30"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400/40 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-900/40">
            {phases[currentPhase].icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 leading-tight">
              {phases[currentPhase].title}
            </h3>
            <p className="text-amber-200/70 text-sm font-serif italic mt-0.5">
              {phases[currentPhase].subtitle}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {phases[currentPhase].instructions.map((instruction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-100/90 font-serif leading-relaxed">
                {instruction}
              </p>
            </motion.div>
          ))}
        </div>

        {phases[currentPhase].tip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-serif font-semibold text-amber-200 text-xs uppercase tracking-wider mb-1">
                  Sage&apos;s Counsel
                </div>
                <p className="text-sm text-amber-100/90 font-serif italic leading-relaxed">
                  {phases[currentPhase].tip}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* AI Assistant Button — opens the Sage wizard chat with full game + phase context */}
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

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevPhase}
          disabled={currentPhase === 0}
          className="px-5 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 disabled:opacity-40 disabled:cursor-not-allowed text-amber-100 rounded-lg font-serif text-sm transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleNextPhase}
          className="flex-1 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 rounded-lg px-5 py-2.5 font-serif font-semibold flex items-center justify-center gap-2 shadow-md shadow-amber-900/30 transition-colors"
        >
          {currentPhase < phases.length - 1 ? (
            <>
              Next Phase
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Complete Game
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <WizardChatModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        gameContext={wizardGameContext}
      />
    </div>
  );
}

function generateGamePhases(game: Game, playerCount: number) {
  return [
    {
      shortName: 'Setup',
      title: 'Game Setup',
      subtitle: 'Prepare the game board and components',
      icon: <Users className="w-6 h-6 text-stone-950" />,
      instructions: [
        `Set up the game board in the center of the playing area`,
        `Each player chooses a color and takes their player pieces`,
        `Shuffle and deal cards according to the rules`,
        `Place tokens and markers in their starting positions`,
      ],
      tip: 'Take your time with setup — a proper setup makes the game run smoothly!',
    },
    {
      shortName: 'Start',
      title: 'Starting the Game',
      subtitle: 'Determine first player and starting positions',
      icon: <Sparkles className="w-6 h-6 text-stone-950" />,
      instructions: [
        `Determine the starting player (usually youngest or most recent winner)`,
        `Review the victory conditions with all players`,
        `Do a quick rules recap if needed`,
        `Begin the first round!`,
      ],
      tip: 'Make sure everyone understands how to win before starting!',
    },
    {
      shortName: 'Round 1',
      title: 'First Round',
      subtitle: 'Practice round — learn the mechanics',
      icon: <Clock className="w-6 h-6 text-stone-950" />,
      instructions: [
        `Starting player takes their turn`,
        `Follow the turn structure: Draw, Action, Discard (if applicable)`,
        `Ask questions if anything is unclear`,
        `Continue clockwise around the table`,
      ],
      tip: "The first round is for learning — don't worry about optimal strategy!",
    },
    {
      shortName: 'Mid',
      title: 'Mid-Game',
      subtitle: 'Core gameplay phase',
      icon: <Flame className="w-6 h-6 text-stone-950" />,
      instructions: [
        `Continue taking turns in order`,
        `Track score/resources as they change`,
        `Pay attention to other players' strategies`,
        `Use your turn actions wisely`,
      ],
      tip: 'Keep an eye on the victory conditions and plan ahead!',
    },
    {
      shortName: 'End',
      title: 'End Game',
      subtitle: 'Final scoring and winner determination',
      icon: <Flag className="w-6 h-6 text-stone-950" />,
      instructions: [
        `Complete the final round`,
        `Count up all points/resources`,
        `Apply any end-game bonuses`,
        `Determine the winner!`,
      ],
      tip: "Don't forget end-game bonuses — they can change everything!",
    },
  ];
}
