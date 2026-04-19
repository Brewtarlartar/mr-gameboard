'use client';

import { useEffect, useState } from 'react';
import { Game, Player } from '@/types/game';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlaySessionStore } from '@/lib/store/playSessionStore';
import { motion } from 'framer-motion';
import { Play as PlayIcon, Gamepad2, RotateCcw, History, X } from 'lucide-react';
import GameSelector from '@/components/play-mode/GameSelector';
import PlayerSetup from '@/components/play-mode/PlayerSetup';
import GameUtilities from '@/components/play-mode/GameUtilities';
import PlayModeAssistant from '@/components/play-mode/PlayModeAssistant';
import LiveLeaderboard from '@/components/play-mode/LiveLeaderboard';
import Image from 'next/image';

export default function PlayModePage() {
  const { loadLibrary } = useGameStore();
  const { draft, setGame, setPlayers, setStep, startSession, clearDraft, hasResumableDraft } =
    usePlaySessionStore();
  const [showResumeBanner, setShowResumeBanner] = useState(false);

  useEffect(() => {
    loadLibrary();
    if (hasResumableDraft()) setShowResumeBanner(true);
  }, [loadLibrary, hasResumableDraft]);

  const selectedGame = draft.game;
  const players = draft.players;
  const currentStep = draft.step;

  const handleGameSelect = (game: Game) => {
    setGame(game);
    setStep('setup');
    setShowResumeBanner(false);
  };

  const handleStartPlaying = () => {
    if (!selectedGame || players.length === 0) return;
    startSession();
  };

  const handleReset = () => {
    clearDraft();
    setShowResumeBanner(false);
  };

  const dismissResume = () => {
    clearDraft();
    setShowResumeBanner(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {showResumeBanner && selectedGame && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4"
        >
          <History className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-100">Resume your session?</p>
            <p className="text-xs text-amber-200/70 truncate">
              {selectedGame.name} • {players.length} player{players.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-semibold rounded-lg transition-all"
          >
            Resume
          </button>
          <button
            onClick={dismissResume}
            className="p-1.5 text-amber-300 hover:text-amber-100 rounded-md"
            aria-label="Discard draft"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {currentStep === 'select' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-100 mb-1">Play</h1>
          <p className="text-stone-400 text-sm">Pick a game, set up players, and track the session.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 'select' && (
            <GameSelector onSelectGame={handleGameSelect} selectedGame={selectedGame} />
          )}

          {currentStep === 'setup' && selectedGame && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-800/50 border border-stone-700/40 rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  {selectedGame.thumbnail ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-stone-700/40">
                      <Image src={selectedGame.thumbnail} alt={selectedGame.name} fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-700/40 flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-7 h-7 text-stone-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-stone-100">{selectedGame.name}</h2>
                    <p className="text-stone-400 text-sm">
                      {selectedGame.minPlayers && selectedGame.maxPlayers
                        ? `${selectedGame.minPlayers}-${selectedGame.maxPlayers} players`
                        : ''}
                      {selectedGame.playingTime && ` • ${selectedGame.playingTime} min`}
                    </p>
                  </div>
                </div>
              </motion.div>

              <PlayerSetup
                players={players}
                onPlayersChange={(next: Player[]) => setPlayers(next)}
                gameAttributes={['role', 'class', 'rank', 'race']}
              />

              {players.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap justify-end gap-3"
                >
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-3 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/40 text-stone-200 rounded-lg transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleStartPlaying}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-lg transition-all shadow"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Start playing
                  </button>
                </motion.div>
              )}
            </>
          )}

          {currentStep === 'playing' && selectedGame && (
            <PlayModeAssistant
              game={selectedGame}
              players={players.map(p => p.name)}
              onComplete={handleReset}
            />
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <GameUtilities game={selectedGame} playerNames={players.map(p => p.name)} />
          {currentStep === 'playing' && players.length > 0 && (
            <LiveLeaderboard players={players.map(p => p.name)} />
          )}
        </div>
      </div>

      {currentStep !== 'select' && currentStep !== 'playing' && (
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/40 text-stone-200 rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
