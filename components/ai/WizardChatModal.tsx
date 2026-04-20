'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { useAIStore } from '@/lib/store/aiStore';
import MarkdownMessage from './MarkdownMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameContext?: string;
  inline?: boolean;
}

export default function WizardChatModal({ isOpen, onClose, gameContext, inline = false }: Props) {
  const { wizardMessages, appendWizardMessage, updateLastAssistantMessage, clearWizard } = useAIStore();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [wizardMessages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text, timestamp: Date.now() };
    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: '', timestamp: Date.now() };

    appendWizardMessage(userMsg);
    appendWizardMessage(assistantMsg);
    setInput('');
    setIsStreaming(true);

    const history = [...wizardMessages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

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
        updateLastAssistantMessage(accumulated);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      updateLastAssistantMessage(`Sorry — I hit an error reaching the AI. ${msg}`);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const body = (
    <>
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-stone-800 bg-stone-900/95 backdrop-blur">
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
              onClick={clearWizard}
              className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

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
            <p className="text-stone-300 text-sm mb-1">Settle a rules debate. Ask about a mechanic.</p>
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
              ) : m.content.length === 0 ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <MarkdownMessage>{m.content}</MarkdownMessage>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-800 bg-stone-900 p-2 sm:p-3">
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
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );

  if (inline) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="inline-wizard"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full overflow-hidden"
          >
            <div className="h-[calc(100dvh-15rem)] sm:h-[55vh] max-h-[55vh] rounded-2xl bg-stone-900 border border-stone-700 flex flex-col overflow-hidden shadow-xl shadow-amber-900/10">
              {body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm flex items-end sm:items-center sm:justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full sm:max-w-2xl h-[92vh] sm:h-[80vh] sm:rounded-2xl bg-stone-900 border-t sm:border border-stone-700 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {body}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
