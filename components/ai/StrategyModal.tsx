'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2, Send } from 'lucide-react';
import { useAIStore } from '@/lib/store/aiStore';
import GamePicker from './GamePicker';
import MarkdownMessage from './MarkdownMessage';

type FollowUpMessage = { id: string; role: 'user' | 'assistant'; content: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDepth?: 'overview' | 'deep';
  inline?: boolean;
  initialGameName?: string;
  lockedGame?: boolean;
}

export default function StrategyModal({
  isOpen,
  onClose,
  initialDepth = 'overview',
  inline = false,
  initialGameName,
  lockedGame = false,
}: Props) {
  const { saveStrategy, getStrategy } = useAIStore();
  const [gameName, setGameName] = useState(initialGameName ?? '');
  const [faction, setFaction] = useState('');
  const [depth, setDepth] = useState<'overview' | 'deep'>(initialDepth);
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  const [followUps, setFollowUps] = useState<FollowUpMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpStreaming, setFollowUpStreaming] = useState(false);
  const followUpAbortRef = useRef<AbortController | null>(null);
  const resultScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) setDepth(initialDepth);
  }, [isOpen, initialDepth]);

  useEffect(() => {
    if (initialGameName !== undefined) {
      setGameName(initialGameName);
    }
  }, [initialGameName]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      followUpAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = resultScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [followUps, followUpStreaming]);

  const canSubmit = gameName.trim().length > 0 && !isStreaming;

  const handleGenerate = async () => {
    const g = gameName.trim();
    const f = faction.trim();
    if (!g) return;

    const cached = getStrategy(g, f, depth);
    if (cached) {
      setContent(cached.content);
      setError(null);
      return;
    }

    setContent('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName: g, ...(f ? { faction: f } : {}), depth }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      saveStrategy({
        gameName: g,
        faction: f || '',
        depth,
        content: accumulated,
        timestamp: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setContent('');
    setError(null);
    setIsStreaming(false);
    setFollowUps([]);
    setFollowUpInput('');
    setFollowUpStreaming(false);
  };

  const handleFollowUp = async () => {
    const text = followUpInput.trim();
    if (!text || followUpStreaming || !content) return;

    const userMsg: FollowUpMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const asstMsg: FollowUpMessage = { id: crypto.randomUUID(), role: 'assistant', content: '' };

    setFollowUps((prev) => [...prev, userMsg, asstMsg]);
    setFollowUpInput('');
    setFollowUpStreaming(true);

    const g = gameName.trim();
    const f = faction.trim();
    const brief = depth === 'deep' ? 'deep-dive strategy' : 'strategy overview';
    const gameContext =
      `The user just received a ${brief} for ${g}${f ? ` (${f})` : ''}. ` +
      `Here is the brief they're looking at:\n\n${content}\n\n` +
      `Answer their follow-up question concisely, in that context.`;

    const history = [...followUps, userMsg].map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    followUpAbortRef.current = controller;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, gameContext }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setFollowUps((prev) =>
          prev.map((m) => (m.id === asstMsg.id ? { ...m, content: accumulated } : m)),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFollowUps((prev) =>
        prev.map((m) =>
          m.id === asstMsg.id
            ? { ...m, content: `Sorry — I hit an error reaching the Sage. ${msg}` }
            : m,
        ),
      );
    } finally {
      setFollowUpStreaming(false);
      followUpAbortRef.current = null;
    }
  };

  const titleText = depth === 'deep' ? 'Deep Strategy' : 'Strategy Overview';
  const titleSubtitle =
    depth === 'deep'
      ? 'Openings, mid-game pivots, and counters'
      : 'A quick brief on how to win';
  const titleIcon = depth === 'deep' ? '/deep-strategy.png' : '/map.png';

  const renderHeader = (closeHandler: () => void, closeLabel = 'Close') => (
    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-amber-900/40 bg-stone-900/95 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <Image
          src={titleIcon}
          alt=""
          width={28}
          height={28}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
        />
        <div className="min-w-0">
          <h2 className="text-amber-100 font-serif font-semibold text-sm sm:text-base truncate">
            {titleText}
          </h2>
          <p className="text-[10px] sm:text-xs text-stone-400 font-serif italic truncate">
            {titleSubtitle}
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
    <div className="px-3 py-2 sm:px-4 sm:py-3 space-y-2 sm:space-y-3">
      {lockedGame && gameName ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/40 rounded-xl">
          <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-100 text-sm font-serif font-semibold truncate">
            {gameName}
          </span>
        </div>
      ) : (
        <GamePicker value={gameName} onChange={setGameName} placeholder="Which game?" />
      )}
      <input
        type="text"
        value={faction}
        onChange={(e) => setFaction(e.target.value)}
        placeholder="Optional: faction, class, or corporation"
        aria-label="Faction, class, or corporation (optional)"
        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
      />
      <div className="flex items-center gap-2">
        <div className="flex bg-stone-800 border border-stone-700 rounded-xl p-1 flex-1">
          <button
            type="button"
            onClick={() => setDepth('overview')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              depth === 'overview'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setDepth('deep')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              depth === 'deep'
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            Deep Dive
          </button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          {isStreaming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Divining…</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>{content ? 'Divine Anew' : 'Divine'}</span>
            </>
          )}
        </button>
      </div>
      {error && !content && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-200 text-sm rounded-xl px-3 py-2 space-y-2">
          <p>{error}</p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline disabled:text-stone-500"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );

  const resultSection = (
    <div
      ref={resultScrollRef}
      className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 min-h-0"
    >
      {error && content && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-200 text-sm rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline disabled:text-stone-500 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {!content && isStreaming && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <p className="text-sm font-serif italic">Divining thy strategy…</p>
        </div>
      )}

      {!content && !isStreaming && !error && (
        <div className="text-center py-10">
          <Image
            src={titleIcon}
            alt=""
            width={64}
            height={64}
            className="w-14 h-14 mx-auto mb-3 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
          />
          <p className="text-stone-300 text-sm mb-1">
            Enter a game and tap Divine — add a faction only if thou wantest role-specific advice.
          </p>
          <p className="text-stone-500 text-xs">
            Example: Terraforming Mars (general) · or add Helion for corporation-focused tips
          </p>
        </div>
      )}

      {content && <MarkdownMessage>{content}</MarkdownMessage>}

      {content && followUps.length > 0 && (
        <div className="mt-6 pt-4 border-t border-amber-900/30 space-y-3">
          {followUps.map((m) => (
            <div
              key={m.id}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] bg-amber-500/20 border border-amber-500/40 rounded-2xl rounded-tr-sm px-4 py-2 text-stone-100'
                    : 'max-w-[92%] bg-stone-800/60 border border-stone-700/40 rounded-2xl rounded-tl-sm px-4 py-2'
                }
              >
                {m.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                ) : m.content.length === 0 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <MarkdownMessage>{m.content}</MarkdownMessage>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {content && !isStreaming && (
        <button
          onClick={handleReset}
          className="mt-4 text-xs text-stone-400 hover:text-amber-200 underline"
        >
          Clear result
        </button>
      )}
    </div>
  );

  const followUpSection = content ? (
    <div className="border-t border-amber-900/40 bg-stone-900 p-2 sm:p-3 safe-area-pb">
      <div className="flex gap-2">
        <textarea
          value={followUpInput}
          onChange={(e) => setFollowUpInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleFollowUp();
            }
          }}
          placeholder="Ask a follow-up…"
          rows={1}
          disabled={followUpStreaming}
          className="flex-1 min-w-0 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs sm:text-sm placeholder-stone-500 placeholder:text-[11px] sm:placeholder:text-sm focus:outline-none focus:border-amber-500/60 resize-none max-h-32"
        />
        <button
          onClick={handleFollowUp}
          disabled={!followUpInput.trim() || followUpStreaming}
          className="px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center gap-1"
          aria-label="Send follow-up"
        >
          {followUpStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  ) : null;

  if (inline) {
    const popupOpen = isOpen && (isStreaming || !!content || !!error);

    const popupNode = (
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            key="strategy-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-sm flex items-stretch justify-center sm:items-center sm:p-4"
            onClick={handleReset}
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
              className="w-full sm:max-w-2xl sm:h-[82vh] rounded-2xl bg-stone-900 border border-amber-900/50 shadow-2xl shadow-amber-950/40 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {renderHeader(handleReset, 'Close result')}
              {resultSection}
              {followUpSection}
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
              key="inline-strategy"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full overflow-hidden"
            >
              <div className="rounded-2xl bg-stone-900 border border-amber-900/50 shadow-xl shadow-amber-900/10 overflow-hidden">
                {renderHeader(onClose)}
                {formSection}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {portalMounted && typeof document !== 'undefined'
          ? createPortal(popupNode, document.body)
          : null}
      </>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full sm:max-w-2xl h-[100dvh] sm:h-[80dvh] sm:rounded-2xl bg-stone-900 sm:border border-amber-900/50 flex flex-col overflow-hidden safe-area-pt"
            onClick={(e) => e.stopPropagation()}
          >
            {renderHeader(onClose)}
            {formSection}
            {resultSection}
            {followUpSection}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
