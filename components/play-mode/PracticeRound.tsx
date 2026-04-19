'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, Dices, Users } from 'lucide-react';
import { Player } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

interface PracticeRoundProps {
  instructions: string[];
  players: Player[];
  onReset: () => void;
}

export default function PracticeRound({
  instructions,
  players,
  onReset,
}: PracticeRoundProps) {
  const [currentInstruction, setCurrentInstruction] = useState(0);

  const nextInstruction = () => {
    if (currentInstruction < instructions.length - 1) {
      setCurrentInstruction(currentInstruction + 1);
    }
  };

  const prevInstruction = () => {
    if (currentInstruction > 0) {
      setCurrentInstruction(currentInstruction - 1);
    }
  };

  const reset = () => {
    setCurrentInstruction(0);
    onReset();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="w-6 h-6 text-teal-500" />
          <h2 className="text-xl font-bold font-display text-gray-900">Practice Round</h2>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-600 rounded-lg transition-all text-sm font-ui font-medium hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {instructions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Dices className="w-14 h-14 mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="font-ui text-lg">Generating practice round guide...</p>
        </div>
      ) : (
        <>
          {/* Current Instruction */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentInstruction}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-8 bg-gray-50 border-2 border-gray-200 rounded-2xl min-h-[200px] flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-3 font-ui font-medium">
                  Instruction {currentInstruction + 1} of {instructions.length}
                </div>
                <div className="text-lg text-gray-900 whitespace-pre-wrap font-body leading-relaxed">
                  {instructions[currentInstruction]}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={prevInstruction}
              disabled={currentInstruction === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-purple-50 border border-gray-200 text-gray-700 hover:text-purple-600 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-gray-700 font-ui font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex gap-2">
              {instructions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentInstruction(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentInstruction
                      ? 'bg-purple-500 w-8'
                      : 'bg-gray-300 hover:bg-gray-400 w-2'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextInstruction}
              disabled={currentInstruction === instructions.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-ui font-semibold shadow-lg shadow-purple-200"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Players Info */}
          {players.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-ui font-medium">
                <Users className="w-4 h-4" />
                Players in this game:
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-ui"
                  >
                    {player.name}
                    {player.role && <span className="text-purple-600 ml-1">({player.role})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
