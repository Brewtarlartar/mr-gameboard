'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Loader2, RotateCcw, History } from 'lucide-react';
import { useAIStore, type WizardMessage } from '@/lib/store/aiStore';
import { readApiError } from '@/lib/ai/readApiError';
import { getPreferences } from '@/lib/storage';
import {
  pushWizardConversation,
  pullWizardConversations,
  deleteWizardConversation,
  type WizardConversationRow,
} from '@/lib/sync/wizardSync';
import { getCurrentUserId } from '@/lib/sync/librarySync';
import MarkdownMessage from './MarkdownMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameContext?: string;
  bggId?: number;
  gameName?: string;
  inline?: boolean;
}

export default function WizardChatModal({
  isOpen,
  onClose,
  gameContext,
  bggId,
  gameName,
  inline = false,
}: Props) {
  const { wizardMessages, appendWizardMessage, updateLastAssistantMessage, clearWizard } = useAIStore();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [titleHint, setTitleHint] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<WizardConversationRow[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const lastUserTextRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [wizardMessages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Lock body scroll only for the full-modal (non-inline) presentation.
  useEffect(() => {
    if (!isOpen || inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, inline]);

  // Track auth state so we know whether to show "Past conversations".
  useEffect(() => {
    if (!inline) return;
    let cancelled = false;
    getCurrentUserId().then((uid) => {
      if (!cancelled) setSignedIn(!!uid);
    });
    return () => {
      cancelled = true;
    };
  }, [inline]);

  const refreshHistory = useCallback(async () => {
    if (!signedIn) {
      setHistory([]);
      return;
    }
    const rows = await pullWizardConversations();
    setHistory(rows);
  }, [signedIn]);

  // Pull history when the inline panel opens (and user is signed in).
  useEffect(() => {
    if (!inline || !isOpen || !signedIn) return;
    refreshHistory();
  }, [inline, isOpen, signedIn, refreshHistory]);

  const persist = useCallback(
    (messages: WizardMessage[], id: string, title: string) => {
      void pushWizardConversation({
        id,
        messages,
        gameId: bggId !== undefined ? String(bggId) : undefined,
        title,
      });
    },
    [bggId],
  );

  const runStream = async (
    history: { role: 'user' | 'assistant'; content: string }[],
    convoId: string,
    title: string,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setLastError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          gameContext,
          ...(bggId ? { bggId } : {}),
          ...(gameName ? { gameName } : {}),
          voice: getPreferences().aiVoice,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(await readApiError(response));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateLastAssistantMessage(accumulated);
      }

      const finalMessages = useAIStore.getState().wizardMessages;
      persist(finalMessages, convoId, title);
      void refreshHistory();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateLastAssistantMessage('');
      setLastError(msg);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: WizardMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const assistantMsg: WizardMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    appendWizardMessage(userMsg);
    appendWizardMessage(assistantMsg);
    lastUserTextRef.current = text;
    setInput('');
    setIsStreaming(true);

    const convoId = conversationId ?? crypto.randomUUID();
    if (!conversationId) setConversationId(convoId);
    const title = titleHint ?? text.slice(0, 80);
    if (!titleHint) setTitleHint(title);

    const history = [...wizardMessages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    persist([...wizardMessages, userMsg, assistantMsg], convoId, title);
    await runStream(history, convoId, title);
  };

  const handleRetry = async () => {
    if (isStreaming || !conversationId) return;
    const lastUser = [...wizardMessages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const upTo = wizardMessages.findIndex((m) => m.id === lastUser.id);
    const history = wizardMessages
      .slice(0, upTo + 1)
      .map((m) => ({ role: m.role, content: m.content }));
    updateLastAssistantMessage('');
    setIsStreaming(true);
    await runStream(history, conversationId, titleHint ?? lastUser.content.slice(0, 80));
  };

  const closePopupAndReset = () => {
    abortRef.current?.abort();
    clearWizard();
    setInput('');
    setLastError(null);
    setConversationId(undefined);
    setTitleHint(undefined);
    setIsStreaming(false);
    onClose();
  };

  const resumeConversation = (row: WizardConversationRow) => {
    abortRef.current?.abort();
    clearWizard();
    for (const m of row.messages) appendWizardMessage(m);
    setConversationId(row.id);
    setTitleHint(row.title ?? undefined);
    setLastError(null);
    setHistoryOpen(false);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
    if (id === conversationId) {
      clearWizard();
      setConversationId(undefined);
      setTitleHint(undefined);
    }
    await deleteWizardConversation(id);
  };

  const popupOpen =
    isOpen && !inline
      ? false
      : isOpen && (wizardMessages.length > 0 || isStreaming || !!lastError);

  const headerNode = (closeHandler: () => void, closeLabel = 'Close') => (
    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-stone-800 bg-stone-900/95 backdrop-blur safe-area-pt">
      <div className="flex items-center gap-2">
        <Image
          src="/crystal-ball.png"
          alt=""
          width={28}
          height={28}
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
        />
        <div>
          <h2 className="text-stone-100 font-semibold text-sm sm:text-base">Ask the Wizard</h2>
          <p className="text-[10px] sm:text-xs text-stone-400">Rules, rulings, and quick strategy</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {wizardMessages.length > 0 && (
          <button
            onClick={() => {
              clearWizard();
              setConversationId(undefined);
              setTitleHint(undefined);
            }}
            className="inline-flex items-center justify-center min-w-11 min-h-11 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={closeHandler}
          className="inline-flex items-center justify-center min-w-11 min-h-11 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
          aria-label={closeLabel}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const chatScroll = (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 space-y-3 sm:space-y-4">
      {wizardMessages.length === 0 && (
        <div className="text-center py-8">
          <Image
            src="/crystal-ball.png"
            alt=""
            width={64}
            height={64}
            className="w-14 h-14 mx-auto mb-3 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
          />
          <p className="text-stone-300 text-sm mb-1">Settle a rule debate. Ask about a mechanic.</p>
          <p className="text-stone-500 text-xs">
            &ldquo;In Catan, can I build through another player&apos;s settlement?&rdquo;
          </p>
        </div>
      )}

      {wizardMessages.map((m) => (
        <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
          <div
            className={
              m.role === 'user'
                ? 'max-w-[85%] bg-amber-500/20 border border-amber-500/40 rounded-2xl rounded-tr-sm px-4 py-2 text-stone-100'
                : 'max-w-[92%] bg-stone-800/60 border border-stone-700/40 rounded-2xl rounded-tl-sm px-4 py-2'
            }
          >
            {m.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            ) : m.content.length === 0 && isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <MarkdownMessage>{m.content}</MarkdownMessage>
            )}
          </div>
        </div>
      ))}

      {lastError && !isStreaming && (
        <div className="flex justify-start">
          <div className="max-w-[92%] bg-red-900/30 border border-red-700/50 text-red-200 text-sm rounded-2xl rounded-tl-sm px-4 py-2 flex items-center justify-between gap-3">
            <span>
              {lastError.startsWith('The Tome') || lastError.startsWith('Thou')
                ? lastError
                : `Sorry — I hit an error reaching the AI. ${lastError}`}
            </span>
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 underline"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const composer = (placeholder: string) => (
    <div className="border-t border-stone-800 bg-stone-900 p-2 sm:p-3 safe-area-pb">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="flex-1 min-w-0 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs sm:text-sm placeholder-stone-500 placeholder:text-[11px] sm:placeholder:text-sm focus:outline-none focus:border-amber-500/60 resize-none max-h-32"
          disabled={isStreaming}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center gap-1"
          aria-label="Send"
        >
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const fullChatBody = (
    <>
      {headerNode(closePopupAndReset)}
      {chatScroll}
      {composer('Ask a follow-up…')}
    </>
  );

  // Inline mode: prompt input only. Popup carries the chat. History opens its own popup.
  if (inline) {
    const popupNode = (
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            key="wizard-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-sm flex items-stretch justify-center sm:items-center sm:p-4"
            onClick={closePopupAndReset}
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
              className="w-full sm:max-w-2xl sm:h-[82vh] rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl shadow-amber-950/30 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {fullChatBody}
            </motion.div>
          </motion.div>
        )}
        {historyOpen && (
          <motion.div
            key="wizard-history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10060] bg-black/75 backdrop-blur-sm flex items-stretch justify-center sm:items-center sm:p-4"
            onClick={() => setHistoryOpen(false)}
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
              className="w-full sm:max-w-md sm:max-h-[70vh] rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl shadow-amber-950/30 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-stone-800 bg-stone-900/95">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-300" />
                  <h2 className="text-stone-100 font-semibold text-sm sm:text-base">Past conversations</h2>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="inline-flex items-center justify-center min-w-11 min-h-11 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
                  aria-label="Close past conversations"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3">
                {history.length === 0 ? (
                  <p className="text-center text-stone-500 text-sm italic font-serif py-8">
                    No saved conversations yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {history.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-stretch gap-1.5 rounded-xl border border-stone-800 hover:border-amber-500/40 bg-stone-950/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => resumeConversation(row)}
                          className="flex-1 text-left px-3 py-2.5 min-w-0"
                        >
                          <div className="text-sm text-amber-100 font-serif truncate">
                            {row.title ?? '(untitled)'}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {new Date(row.updated_at).toLocaleString()}
                            {row.game_id ? ` · game ${row.game_id}` : ''}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryItem(row.id)}
                          className="px-3 text-stone-500 hover:text-red-300 hover:bg-red-950/20 transition-colors"
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              key="inline-wizard-input"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-full overflow-hidden"
            >
              <div className="rounded-2xl bg-stone-900 border border-stone-700 p-2 sm:p-3 shadow-xl shadow-amber-900/10 space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask about a rule, a ruling, or a quick strategy call…"
                    rows={1}
                    className="flex-1 min-w-0 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs sm:text-sm placeholder-stone-500 placeholder:text-[11px] sm:placeholder:text-sm focus:outline-none focus:border-amber-500/60 resize-none max-h-32"
                    disabled={isStreaming}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    className="px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center gap-1"
                    aria-label="Ask"
                  >
                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {signedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      void refreshHistory();
                      setHistoryOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-amber-200 transition-colors"
                  >
                    <History className="w-3 h-3" />
                    <span>Past conversations{history.length > 0 ? ` (${history.length})` : ''}</span>
                  </button>
                )}
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

  // Non-inline (full-modal) presentation kept for compatibility.
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center sm:justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full sm:max-w-2xl h-[100dvh] sm:h-[80dvh] sm:rounded-2xl bg-stone-900 sm:border border-stone-700 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {headerNode(onClose)}
            {chatScroll}
            {composer('Ask about a rule, a ruling, or a quick strategy call…')}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
