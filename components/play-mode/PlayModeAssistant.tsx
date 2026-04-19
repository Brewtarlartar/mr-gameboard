'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, ChevronLeft, CheckCircle, MessageSquare, Clock, Users, Flag, Flame } from 'lucide-react';
import { Game } from '@/types/game';
import { useHapticFeedback } from '@/lib/hooks/useMobile';

interface PlayModeAssistantProps {
  game: Game;
  players: string[];
  onComplete?: () => void;
}

export default function PlayModeAssistant({ game, players, onComplete }: PlayModeAssistantProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold font-display text-gray-900">{game.name}</h3>
          <span className="text-sm text-gray-500 font-ui">
            Phase {currentPhase + 1} of {phases.length}
          </span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute h-full bg-gradient-to-r from-violet-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-3">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => {
                haptic.light();
                setCurrentPhase(index);
              }}
              className={`text-xs font-ui font-medium transition-all ${
                index <= currentPhase 
                  ? 'text-purple-600' 
                  : 'text-gray-400 hover:text-gray-600'
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
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
            {phases[currentPhase].icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold font-display text-gray-900 mb-1">
              {phases[currentPhase].title}
            </h3>
            <p className="text-gray-500 text-sm font-ui">{phases[currentPhase].subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          {phases[currentPhase].instructions.map((instruction, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-900 font-body">{instruction}</p>
            </motion.div>
          ))}
        </div>

        {phases[currentPhase].tip && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-purple-600 text-sm mb-1 font-ui">Pro Tip</div>
                <p className="text-sm text-gray-700 font-body italic">{phases[currentPhase].tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* AI Assistant Button */}
      <button
        onClick={() => {
          haptic.medium();
          setShowAiAssistant(!showAiAssistant);
        }}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-xl transition-all active:scale-95"
      >
        <MessageSquare className="w-5 h-5 text-purple-600" />
        <span className="font-semibold font-ui text-purple-600">
          {showAiAssistant ? 'Hide' : 'Ask'} AI Assistant
        </span>
      </button>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevPhase}
          disabled={currentPhase === 0}
          className="px-6 py-3 bg-gray-100 hover:bg-purple-50 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 rounded-xl font-semibold font-ui transition-all flex items-center gap-2 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNextPhase}
          className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl px-6 py-3 font-semibold font-ui flex items-center justify-center gap-2 active:scale-95 hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-purple-200 transition-all"
        >
          {currentPhase < phases.length - 1 ? (
            <>
              Next Phase
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Complete Game
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function generateGamePhases(game: Game, playerCount: number) {
  return [
    {
      shortName: 'Setup',
      title: 'Game Setup',
      subtitle: 'Prepare the game board and components',
      icon: <Users className="w-6 h-6 text-white" />,
      instructions: [
        `Set up the game board in the center of the playing area`,
        `Each player chooses a color and takes their player pieces`,
        `Shuffle and deal cards according to the rules`,
        `Place tokens and markers in their starting positions`,
      ],
      tip: 'Take your time with setup - a proper setup makes the game run smoothly!',
    },
    {
      shortName: 'Start',
      title: 'Starting the Game',
      subtitle: 'Determine first player and starting positions',
      icon: <Sparkles className="w-6 h-6 text-white" />,
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
      subtitle: 'Practice round - learn the mechanics',
      icon: <Clock className="w-6 h-6 text-white" />,
      instructions: [
        `Starting player takes their turn`,
        `Follow the turn structure: Draw, Action, Discard (if applicable)`,
        `Ask questions if anything is unclear`,
        `Continue clockwise around the table`,
      ],
      tip: 'The first round is for learning - don\'t worry about optimal strategy!',
    },
    {
      shortName: 'Mid',
      title: 'Mid-Game',
      subtitle: 'Core gameplay phase',
      icon: <Flame className="w-6 h-6 text-white" />,
      instructions: [
        `Continue taking turns in order`,
        `Track score/resources as they change`,
        `Pay attention to other players\' strategies`,
        `Use your turn actions wisely`,
      ],
      tip: 'Keep an eye on the victory conditions and plan ahead!',
    },
    {
      shortName: 'End',
      title: 'End Game',
      subtitle: 'Final scoring and winner determination',
      icon: <Flag className="w-6 h-6 text-white" />,
      instructions: [
        `Complete the final round`,
        `Count up all points/resources`,
        `Apply any end-game bonuses`,
        `Determine the winner!`,
      ],
      tip: 'Don\'t forget end-game bonuses - they can change everything!',
    },
  ];
}
