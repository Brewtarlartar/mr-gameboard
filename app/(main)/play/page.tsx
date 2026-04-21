'use client';

import { useEffect, useState } from 'react';
import { Game, Player } from '@/types/game';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlaySessionStore } from '@/lib/store/playSessionStore';
import { motion } from 'framer-motion';
import { Play as PlayIcon, Gamepad2, RotateCcw, History, X, Swords, Trophy } from 'lucide-react';
import GameSelector from '@/components/play-mode/GameSelector';
import PlayerSetup from '@/components/play-mode/PlayerSetup';
import GameUtilities from '@/components/play-mode/GameUtilities';
import PlayModeAssistant from '@/components/play-mode/PlayModeAssistant';
import TeachMeModal from '@/components/ai/TeachMeModal';
import Image from 'next/image';

export default function PlayModePage() {
  const { loadLibrary } = useGameStore();
  const {
    draft,
    setGame,
    setPlayers,
    setStep,
    startSession,
    clearDraft,
    hasResumableDraft,
    completeSession,
  } = usePlaySessionStore();
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [teachOpen, setTeachOpen] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string | null>(null);

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

  const handleComplete = () => {
    const gameName = selectedGame?.name ?? 'the session';
    const { mode, players: scoreRows, coopOutcome } = draft.scoreState ?? {
      mode: 'competitive' as const,
      players: [],
      coopOutcome: null,
    };
    let summary = `${gameName} saved to thy chronicle`;
    if (scoreRows.length > 0) {
      if (mode === 'competitive') {
        const totals = scoreRows.map((p) => ({
          name: p.name,
          total: Object.values(p.categories).reduce((s, v) => s + (v || 0), 0),
        }));
        const max = totals.reduce((m, t) => Math.max(m, t.total), 0);
        const winners = totals.filter((t) => max > 0 && t.total === max).map((t) => t.name);
        if (winners.length > 0) {
          summary = `${gameName} saved — ${winners.join(' & ')} won with ${max}`;
        }
      } else if (mode === 'coop' && coopOutcome) {
        summary = `${gameName} saved — group ${coopOutcome === 'win' ? 'victory' : 'defeat'}`;
      } else if (mode === 'team') {
        summary = `${gameName} saved to thy chronicle`;
      }
    }
    completeSession();
    setShowResumeBanner(false);
    setSavedSummary(summary);
    setTimeout(() => setSavedSummary(null), 4500);
  };

  const dismissResume = () => {
    clearDraft();
    setShowResumeBanner(false);
  };

  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          Play
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic mt-1">
          {currentStep === 'select'
            ? 'Pick a game, gather thy fellowship, and begin the session'
            : currentStep === 'setup'
            ? 'Add the adventurers who shall play this round'
            : 'May fortune favor thee'}
        </p>
      </div>

      {savedSummary && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4"
        >
          <Trophy className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-semibold text-emerald-100 truncate">
              {savedSummary}
            </p>
            <p className="text-xs text-emerald-200/70 font-serif italic">
              Check the Analytics tab to see thy legend grow
            </p>
          </div>
          <button
            onClick={() => setSavedSummary(null)}
            className="p-1.5 text-emerald-300 hover:text-emerald-100 rounded-md transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {showResumeBanner && selectedGame && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/40 rounded-xl p-4"
        >
          <History className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-semibold text-amber-100">
              Resume thy session?
            </p>
            <p className="text-xs text-amber-200/70 truncate font-serif italic">
              {selectedGame.name} • {players.length}{' '}
              {players.length === 1 ? 'player' : 'players'}
            </p>
          </div>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="px-3 py-1.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 text-xs font-serif font-semibold rounded-lg shadow-md shadow-amber-900/30 transition-colors"
          >
            Resume
          </button>
          <button
            onClick={dismissResume}
            className="p-1.5 text-amber-300 hover:text-amber-100 rounded-md transition-colors"
            aria-label="Discard draft"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 'select' && (
            <GameSelector
              onSelectGame={handleGameSelect}
              selectedGame={selectedGame}
            />
          )}

          {currentStep === 'setup' && selectedGame && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-2xl p-5 shadow-lg shadow-black/30"
              >
                <div className="flex items-center gap-4">
                  {(selectedGame.thumbnail || selectedGame.image) ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-amber-900/40 bg-stone-950">
                      <Image
                        src={selectedGame.thumbnail || selectedGame.image!}
                        alt={selectedGame.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-stone-900 border border-amber-900/40 flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-7 h-7 text-amber-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-serif font-bold text-amber-100 truncate">
                      {selectedGame.name}
                    </h2>
                    <p className="text-amber-200/70 text-sm font-serif italic">
                      {selectedGame.minPlayers && selectedGame.maxPlayers
                        ? `${selectedGame.minPlayers}-${selectedGame.maxPlayers} players`
                        : ''}
                      {selectedGame.playingTime &&
                        ` • ${selectedGame.playingTime} min`}
                    </p>
                  </div>
                </div>
              </motion.div>

              <button
                onClick={() => setTeachOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-stone-900/80 to-stone-950/80 hover:from-amber-950/30 hover:to-stone-950/80 border border-amber-900/50 hover:border-amber-500/60 rounded-xl transition-colors text-left group"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400/40 flex items-center justify-center shadow-md shadow-amber-900/30">
                  <Swords className="w-5 h-5 text-stone-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-serif font-semibold text-amber-100 text-sm leading-tight">
                    Skip the Rulebook
                  </div>
                  <div className="text-xs text-amber-200/70 font-serif italic truncate">
                    Get a guided teach for {selectedGame.name} before you begin
                  </div>
                </div>
              </button>

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
                    className="flex items-center gap-2 px-4 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleStartPlaying}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 font-serif font-semibold rounded-lg shadow-md shadow-amber-900/30 transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start Playing
                  </button>
                </motion.div>
              )}
            </>
          )}

          {currentStep === 'playing' && selectedGame && (
            <PlayModeAssistant
              game={selectedGame}
              players={players.map((p) => p.name)}
              onComplete={handleComplete}
            />
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <GameUtilities game={selectedGame} />
        </div>
      </div>

      {currentStep !== 'select' && currentStep !== 'playing' && (
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        </div>
      )}

      <TeachMeModal
        isOpen={teachOpen}
        onClose={() => setTeachOpen(false)}
        initialGameName={selectedGame?.name}
        lockedGame={!!selectedGame}
        initialPlayerCount={players.length || undefined}
      />
    </div>
  );
}
