'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, Target, Swords, BookOpenCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import WizardChatModal from './WizardChatModal';
import StrategyModal from './StrategyModal';
import TeachMeModal from './TeachMeModal';

type ActiveModal = 'wizard' | 'overview' | 'deep' | 'teach' | null;

interface Card {
  id: Exclude<ActiveModal, null>;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  image?: string;
}

const CARDS: Card[] = [
  {
    id: 'wizard',
    label: 'Ask the Wizard',
    description: 'Rules debates, quick rulings',
    icon: MessageCircle,
    image: '/crystal-ball.png',
  },
  {
    id: 'overview',
    label: 'Strategy Overview',
    description: 'How to win with thy faction',
    icon: Target,
    image: '/map.png',
  },
  {
    id: 'deep',
    label: 'Deep Strategy',
    description: 'Openings, mid-game, counters',
    icon: Swords,
    image: '/deep-strategy.png',
  },
  {
    id: 'teach',
    label: 'Skip the Rulebooks',
    description: 'A guided teach for thy table',
    icon: BookOpenCheck,
    image: '/skip-the-rules.png',
  },
];

export default function AICompanionSection() {
  const [active, setActive] = useState<ActiveModal>(null);
  const close = () => setActive(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (active) {
      document.body.classList.add('ai-panel-open');
    } else {
      document.body.classList.remove('ai-panel-open');
    }
    return () => {
      document.body.classList.remove('ai-panel-open');
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      cardRefs.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);
    return () => window.clearTimeout(id);
  }, [active]);

  return (
    <section className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative shrink-0 w-40 sm:w-52 md:w-64 lg:w-72 sm:self-center"
        >
          <Image
            src="/Wizard.png"
            alt="The Tome Wizard"
            width={1024}
            height={768}
            className="w-full h-auto drop-shadow-[0_0_28px_rgba(251,191,36,0.28)]"
            priority
          />
        </motion.div>

        <div className="relative w-full sm:flex-1 sm:w-auto min-w-0">
          <div
            aria-hidden="true"
            className="sm:hidden absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-x-8 border-x-transparent border-b-[10px] border-b-amber-500/40"
          />
          <div
            aria-hidden="true"
            className="sm:hidden absolute left-1/2 -translate-x-1/2 -top-[6px] w-0 h-0 border-x-[7px] border-x-transparent border-b-[9px] border-b-stone-900"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -left-2 top-8 w-0 h-0 border-y-8 border-y-transparent border-r-[10px] border-r-amber-500/40"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -left-[6px] top-[33px] w-0 h-0 border-y-[7px] border-y-transparent border-r-[9px] border-r-stone-900"
          />

          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-stone-900/85 to-stone-900 p-3 sm:p-4 shadow-lg shadow-amber-900/20">
            <p className="text-amber-200/95 text-sm sm:text-base italic font-serif mb-3 leading-snug">
              &ldquo;Hail, traveler. What wisdom dost thou seek at the table this eve?&rdquo;
            </p>

            <div className="flex flex-col gap-2">
              {CARDS.map((card, i) => {
                const Icon = card.icon;
                const isActive = active === card.id;
                return (
                  <div
                    key={card.id}
                    ref={(el) => {
                      cardRefs.current[card.id] = el;
                    }}
                    className="flex flex-col gap-2 scroll-mt-24"
                  >
                    <motion.button
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                      onClick={() => setActive(isActive ? null : card.id)}
                      className={cn(
                        'group relative flex items-center gap-3 pl-2 pr-3 py-2 text-left transition-all',
                        'rounded-md border',
                        'bg-gradient-to-r from-stone-950/90 via-stone-900/70 to-stone-950/90',
                        isActive
                          ? 'border-amber-400/70 shadow-[0_0_18px_-4px_rgba(251,191,36,0.55)] from-amber-950/40 via-stone-900/80 to-amber-950/40'
                          : 'border-amber-900/60 hover:border-amber-500/60 hover:shadow-[0_0_14px_-4px_rgba(251,191,36,0.4)]',
                      )}
                    >
                      <div className="shrink-0 w-12 h-12 flex items-center justify-center">
                        {card.image ? (
                          <Image
                            src={card.image}
                            alt=""
                            width={56}
                            height={56}
                            className={cn(
                              'max-w-full max-h-full object-contain transition-all',
                              isActive
                                ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                                : 'drop-shadow-[0_0_6px_rgba(251,191,36,0.35)] group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]',
                            )}
                          />
                        ) : (
                          <div
                            className={cn(
                              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                              'bg-gradient-to-br from-amber-600/30 via-amber-900/50 to-stone-950',
                              'border',
                              'shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]',
                              isActive
                                ? 'border-amber-300/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_0_12px_rgba(251,191,36,0.5)]'
                                : 'border-amber-500/40 group-hover:border-amber-400/70 group-hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_0_10px_rgba(251,191,36,0.35)]',
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-4 h-4 transition-colors',
                                isActive ? 'text-amber-100' : 'text-amber-200 group-hover:text-amber-100',
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'font-serif font-semibold text-sm leading-tight tracking-wide transition-colors',
                            isActive ? 'text-amber-100' : 'text-amber-100/95 group-hover:text-amber-100',
                          )}
                        >
                          {card.label}
                        </div>
                        <div className="text-[11px] text-stone-400 font-serif italic leading-snug truncate">
                          {card.description}
                        </div>
                      </div>

                      <ChevronRight
                        className={cn(
                          'w-4 h-4 shrink-0 transition-all',
                          isActive
                            ? 'text-amber-300 rotate-90'
                            : 'text-amber-700 group-hover:text-amber-400',
                        )}
                      />
                    </motion.button>

                    {card.id === 'wizard' && (
                      <WizardChatModal inline isOpen={isActive} onClose={close} />
                    )}
                    {(card.id === 'overview' || card.id === 'deep') && (
                      <StrategyModal
                        inline
                        isOpen={isActive}
                        onClose={close}
                        initialDepth={card.id === 'deep' ? 'deep' : 'overview'}
                      />
                    )}
                    {card.id === 'teach' && (
                      <TeachMeModal inline isOpen={isActive} onClose={close} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
