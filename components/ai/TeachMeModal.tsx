'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronLeft, ChevronRight, Swords, MessageCircle, Plus, Minus } from 'lucide-react';
import { useAIStore, teachKey } from '@/lib/store/aiStore';
import { readApiError } from '@/lib/ai/readApiError';
import { getPreferences } from '@/lib/storage';
import type { TeachPlan, TeachPlayer } from '@/lib/ai/types';
import GamePicker from './GamePicker';
import MarkdownMessage from './MarkdownMessage';
import WizardChatModal from './WizardChatModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
  initialGameName?: string;
  lockedGame?: boolean;
  initialPlayerCount?: number;
}

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 8;

export default function TeachMeModal({
  isOpen,
  onClose,
  inline = false,
  initialGameName,
  lockedGame = false,
  initialPlayerCount,
}: Props) {
  const { saveTeach, getTeach } = useAIStore();
  const [gameName, setGameName] = useState(initialGameName ?? '');
  const [players, setPlayers] = useState<TeachPlayer[]>([
    { name: '', faction: '' },
    { name: '', faction: '' },
  ]);
  const [plan, setPlan] = useState<TeachPlan | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  useEffect(() => {
    if (initialGameName !== undefined) {
      setGameName(initialGameName);
    }
  }, [initialGameName]);

  useEffect(() => {
    if (initialPlayerCount && initialPlayerCount > 0) {
      setPlayers((prev) => {
        const target = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, initialPlayerCount));
        if (prev.length === target) return prev;
        if (prev.length < target) {
          const next = [...prev];
          while (next.length < target) {
            next.push({ name: '', faction: '' });
          }
          return next;
        }
        return prev.slice(0, target);
      });
    }
  }, [initialPlayerCount]);

  const playerCount = players.length;
  const canSubmit = gameName.trim().length > 0 && players.length >= 1 && !isLoading;

  const normalizedPlayers = useMemo<TeachPlayer[]>(
    () =>
      players.map((p, i) => ({
        name: p.name.trim() || `Player ${i + 1}`,
        faction: p.faction ?? '',
      })),
    [players],
  );

  const cacheKeyStr = useMemo(
    () => (gameName.trim() ? teachKey(gameName.trim(), playerCount, normalizedPlayers) : ''),
    [gameName, playerCount, normalizedPlayers],
  );

  const updatePlayer = (index: number, patch: Partial<TeachPlayer>) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((prev) => [...prev, { name: '', faction: '' }]);
  };

  const removePlayer = () => {
    if (players.length <= MIN_PLAYERS) return;
    setPlayers((prev) => prev.slice(0, -1));
  };

  const handleStart = async () => {
    const g = gameName.trim();
    if (!g) return;

    const cached = getTeach(cacheKeyStr);
    if (cached) {
      setPlan(cached.plan);
      setChapterIndex(0);
      setError(null);
      return;
    }

    setPlan(null);
    setChapterIndex(0);
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/ai/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: g,
          playerCount,
          players: normalizedPlayers,
          voice: getPreferences().aiVoice,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as TeachPlan;
      if (!data || !Array.isArray(data.chapters) || data.chapters.length === 0) {
        throw new Error('The teacher returned an empty plan. Try again?');
      }

      setPlan(data);
      setChapterIndex(0);
      saveTeach(cacheKeyStr, {
        gameName: g,
        playerCount,
        players: normalizedPlayers,
        plan: data,
        timestamp: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setPlan(null);
    setChapterIndex(0);
    setError(null);
    setIsLoading(false);
  };

  const handleClosePlan = () => {
    setPlan(null);
    setChapterIndex(0);
  };

  const chapter = plan?.chapters[chapterIndex];
  const isLastChapter = plan ? chapterIndex >= plan.chapters.length - 1 : false;
  const isFirstChapter = chapterIndex === 0;

  const gameContextForWizard = useMemo(() => {
    if (!gameName.trim()) return undefined;
    const roster = normalizedPlayers
      .map((p) => (p.faction ? `${p.name} (${p.faction})` : p.name))
      .join(', ');
    return `The user is currently learning ${gameName.trim()} with ${playerCount} player${
      playerCount === 1 ? '' : 's'
    }: ${roster}.`;
  }, [gameName, playerCount, normalizedPlayers]);

  const renderHeader = (
    closeHandler: () => void,
    subtitle: string,
    closeLabel = 'Close',
  ) => (
    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-amber-900/40 bg-stone-900/95 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <Image
          src="/skip-the-rules.png"
          alt=""
          width={28}
          height={28}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
        />
        <div className="min-w-0">
          <h2 className="text-amber-100 font-serif font-semibold text-sm sm:text-base truncate">
            Skip the Rulebooks
          </h2>
          <p className="text-[10px] sm:text-xs text-stone-400 font-serif italic truncate">
            {subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={closeHandler}
        className="inline-flex items-center justify-center min-w-11 min-h-11 text-stone-400 hover:text-amber-200 rounded-lg hover:bg-stone-800 transition-colors"
        aria-label={closeLabel}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  const formSection = (
    <div className="px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-400 mb-1.5">
          Game
        </label>
        {lockedGame && gameName ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 rounded-xl">
            <Swords className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-100 text-sm font-serif font-semibold truncate">
              {gameName}
            </span>
          </div>
        ) : (
          <GamePicker value={gameName} onChange={setGameName} placeholder="Which game?" />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-stone-400">
            Players ({playerCount})
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={removePlayer}
              disabled={players.length <= MIN_PLAYERS}
              className="p-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove player"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={addPlayer}
              disabled={players.length >= MAX_PLAYERS}
              className="p-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Add player"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePlayer(i, { name: e.target.value })}
                placeholder={`Player ${i + 1}`}
                className="w-1/3 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
              />
              <input
                type="text"
                value={p.faction ?? ''}
                onChange={(e) => updatePlayer(i, { faction: e.target.value })}
                placeholder="Faction / character (optional)"
                className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-200 text-sm rounded-xl px-3 py-2 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline disabled:text-stone-500 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={!canSubmit}
        className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sounding the War Horn…</span>
          </>
        ) : (
          <>
            <Swords className="w-4 h-4" />
            <span>Sound the War Horn</span>
          </>
        )}
      </button>

      <p className="text-xs text-stone-500 text-center font-serif italic">
        The teacher will walk the whole table through setup, turns, combat, and how to win.
      </p>
    </div>
  );

  const planBody = plan && chapter && (
    <>
      <div className="px-4 py-2 border-b border-amber-900/30 flex items-center justify-between bg-stone-900/70">
        <div className="text-xs text-stone-400 font-serif italic">
          Chapter {chapterIndex + 1} of {plan.chapters.length}
        </div>
        <button
          onClick={handleReset}
          className="text-xs text-stone-400 hover:text-amber-200 underline"
        >
          Start over
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 min-h-0">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-amber-100 mb-2">
          {chapter.heading}
        </h3>
        <MarkdownMessage>{chapter.body}</MarkdownMessage>
      </div>

      <div className="border-t border-amber-900/40 bg-stone-900 px-3 py-3 space-y-2 safe-area-pb">
        <div className="flex gap-2">
          <button
            onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
            disabled={isFirstChapter}
            className="flex-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => setChapterIndex((i) => Math.min(plan.chapters.length - 1, i + 1))}
            disabled={isLastChapter}
            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="w-full px-3 py-2 text-sm text-stone-300 hover:text-amber-200 border border-amber-900/40 hover:border-amber-500/60 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Ask a question about this game
        </button>
      </div>
    </>
  );

  if (inline) {
    const inlineSubtitle = 'Get a guided teach for your table';
    const popupSubtitle = plan ? plan.title : inlineSubtitle;
    const popupOpen = isOpen && !!plan;

    const popupNode = (
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            key="teach-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-sm flex items-stretch justify-center sm:items-center sm:p-4"
            onClick={handleClosePlan}
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            }}
          >
            <motion.div
              initial={{ y: '6%', opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '6%', opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full sm:max-w-2xl sm:h-[85vh] rounded-2xl bg-stone-900 border border-amber-900/50 shadow-2xl shadow-amber-950/40 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(handleClosePlan, popupSubtitle, 'Close teach')}
              {planBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="inline-teach"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full overflow-hidden"
            >
              <div className="rounded-2xl bg-stone-900 border border-amber-900/50 shadow-xl shadow-amber-900/10 overflow-hidden">
                {renderHeader(onClose, inlineSubtitle)}
                {formSection}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {portalMounted && typeof document !== 'undefined'
          ? createPortal(popupNode, document.body)
          : null}

        <WizardChatModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          gameContext={gameContextForWizard}
        />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center sm:justify-center sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full sm:max-w-2xl h-[92vh] sm:h-[85vh] sm:rounded-2xl bg-stone-900 border-t sm:border border-amber-900/50 flex flex-col overflow-hidden safe-area-pt"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(onClose, plan ? plan.title : 'Get a guided teach for your table')}
              {plan && chapter ? planBody : formSection}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WizardChatModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        gameContext={gameContextForWizard}
      />
    </>
  );
}
