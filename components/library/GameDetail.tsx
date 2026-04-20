'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Users,
  Clock,
  Star,
  BookOpen,
  ExternalLink,
  ShoppingCart,
  Loader2,
  Play,
  MessageCircle,
  Target,
  Swords,
  BookOpenCheck,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Game, Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { decodeHtmlEntities } from '@/lib/text/decodeHtml';
import { usePlaySessionStore } from '@/lib/store/playSessionStore';
import { buildGameContext } from '@/lib/ai/prompts';
import WizardChatModal from '@/components/ai/WizardChatModal';
import StrategyModal from '@/components/ai/StrategyModal';
import TeachMeModal from '@/components/ai/TeachMeModal';

type ActivePanel = 'play' | 'wizard' | 'overview' | 'deep' | 'teach' | null;

interface ActionCard {
  id: Exclude<ActivePanel, null>;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  image?: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    id: 'play',
    label: 'Play Now',
    description: 'Quick-start this game at thy table',
    icon: Play,
  },
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

interface GameDetailProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (gameId: string) => void;
  isFavorite: boolean;
  onRemove?: (gameId: string) => void;
}

function cleanDescription(description: string): string {
  return decodeHtmlEntities(description);
}

function getAmazonSearchUrl(gameName: string): string {
  const searchTerm = `${gameName} board game`;
  return `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}&tag=mrboardgame-20`;
}

export default function GameDetail({
  game,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite,
  onRemove,
}: GameDetailProps) {
  const [liveDescription, setLiveDescription] = useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<ActivePanel>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setActive(null);
      setLiveDescription(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const currentDescLength = game?.description?.length || 0;
    const needsEnrichment = game && game.bggId && currentDescLength < 500;

    if (isOpen && needsEnrichment) {
      setIsLoadingDescription(true);
      setLiveDescription(null);

      fetch(`/api/bgg/details/${game.bggId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Details API returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data?.description && data.description.length > currentDescLength) {
            setLiveDescription(data.description);
          } else {
            return fetch(`/api/bgg/game/${game.bggId}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((gameData) => {
                if (gameData?.game?.description && gameData.game.description.length > currentDescLength) {
                  setLiveDescription(gameData.game.description);
                }
              });
          }
        })
        .catch(() => {
          fetch(`/api/bgg/game/${game.bggId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((gameData) => {
              if (gameData?.game?.description && gameData.game.description.length > currentDescLength) {
                setLiveDescription(gameData.game.description);
              }
            })
            .catch(() => {});
        })
        .finally(() => setIsLoadingDescription(false));
    }
  }, [isOpen, game?.bggId, game?.name, game?.description]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      cardRefs.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 320);
    return () => window.clearTimeout(id);
  }, [active]);

  const closePanel = () => setActive(null);

  const gameContext = useMemo(() => {
    if (!game) return undefined;
    return buildGameContext({ gameName: game.name });
  }, [game]);

  if (!game) return null;

  const displayDescription = liveDescription || game.description;
  const cleanedDescription = displayDescription ? cleanDescription(displayDescription) : null;
  const amazonUrl = getAmazonSearchUrl(game.name);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            style={{ zIndex: 9998 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-stretch justify-center sm:items-center"
            style={{
              zIndex: 9999,
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="relative w-full sm:max-w-3xl h-full sm:h-[92vh] sm:my-4 sm:mx-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 border-t sm:border border-amber-900/60 sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hero */}
              <div className="relative shrink-0 h-48 sm:h-56 bg-stone-950">
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-700">
                    <span className="text-6xl">🎲</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-transparent to-stone-950/40" />

                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => onToggleFavorite(game.id)}
                    className="p-2 bg-stone-950/80 hover:bg-stone-900 border border-amber-900/50 rounded-full transition-colors"
                    aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Heart
                      className={cn(
                        'w-5 h-5',
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-amber-200/80',
                      )}
                    />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 bg-stone-950/80 hover:bg-stone-900 border border-amber-900/50 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-amber-200/80" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 px-4 pb-3 sm:px-6 sm:pb-4">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] leading-tight">
                    {game.name}
                  </h1>
                  {game.yearPublished && (
                    <p className="text-amber-200/70 text-xs sm:text-sm font-serif italic mt-0.5">
                      Published {game.yearPublished}
                    </p>
                  )}
                </div>
              </div>

              {/* Scroll body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Stat chips */}
                  <div className="flex flex-wrap gap-2">
                    {game.minPlayers !== undefined && game.maxPlayers !== undefined && (
                      <StatChip
                        icon={<Users className="w-3.5 h-3.5 text-amber-400" />}
                        label="Players"
                        value={`${game.minPlayers}-${game.maxPlayers}`}
                      />
                    )}
                    {(game.playingTime || game.minPlayingTime) && (
                      <StatChip
                        icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
                        label="Time"
                        value={`${game.playingTime || `${game.minPlayingTime}-${game.maxPlayingTime}`}m`}
                      />
                    )}
                    {game.complexity !== undefined && game.complexity !== null && (
                      <StatChip
                        icon={<Star className="w-3.5 h-3.5 text-amber-400" />}
                        label="Weight"
                        value={`${game.complexity.toFixed(1)}/5`}
                      />
                    )}
                    {game.rating !== undefined && game.rating !== null && (
                      <StatChip
                        icon={<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                        label="Rating"
                        value={`${game.rating.toFixed(1)}/10`}
                      />
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-stone-900/85 to-stone-950 p-3 shadow-lg shadow-amber-900/20">
                    <p className="text-amber-200/95 text-xs sm:text-sm italic font-serif mb-2.5 leading-snug px-1">
                      &ldquo;Hail. What dost thou seek of <span className="font-semibold not-italic text-amber-100">{game.name}</span>?&rdquo;
                    </p>

                    <div className="flex flex-col gap-2">
                      {ACTION_CARDS.map((card, i) => {
                        const Icon = card.icon;
                        const isActive = active === card.id;
                        return (
                          <div
                            key={card.id}
                            ref={(el) => {
                              cardRefs.current[card.id] = el;
                            }}
                            className="flex flex-col gap-2 scroll-mt-4"
                          >
                            <motion.button
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
                              onClick={() => setActive(isActive ? null : card.id)}
                              className={cn(
                                'group relative flex items-center gap-3 pl-2 pr-3 py-2.5 text-left transition-all rounded-md border',
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
                                      'border shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]',
                                      isActive
                                        ? 'border-amber-300/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_0_12px_rgba(251,191,36,0.5)]'
                                        : 'border-amber-500/40 group-hover:border-amber-400/70',
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

                            {card.id === 'play' && (
                              <QuickStartPanel
                                game={game}
                                isOpen={isActive}
                                onClose={closePanel}
                                onSwitchTo={(panel) => setActive(panel)}
                              />
                            )}
                            {card.id === 'wizard' && (
                              <WizardChatModal
                                inline
                                isOpen={isActive}
                                onClose={closePanel}
                                gameContext={gameContext}
                              />
                            )}
                            {(card.id === 'overview' || card.id === 'deep') && (
                              <StrategyModal
                                inline
                                isOpen={isActive}
                                onClose={closePanel}
                                initialDepth={card.id === 'deep' ? 'deep' : 'overview'}
                                initialGameName={game.name}
                                lockedGame
                              />
                            )}
                            {card.id === 'teach' && (
                              <TeachMeModal
                                inline
                                isOpen={isActive}
                                onClose={closePanel}
                                initialGameName={game.name}
                                lockedGame
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* About */}
                  <section>
                    <h2 className="text-base font-serif font-bold text-amber-100 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      About
                      {isLoadingDescription && (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      )}
                      {liveDescription && !isLoadingDescription && (
                        <span className="text-[10px] text-amber-400/80 font-normal italic">
                          full BGG description
                        </span>
                      )}
                    </h2>

                    {cleanedDescription ? (
                      <div className="text-stone-300 leading-relaxed space-y-2">
                        {cleanedDescription.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="text-sm">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : isLoadingDescription ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-stone-800/60 rounded animate-pulse w-full" />
                        <div className="h-4 bg-stone-800/60 rounded animate-pulse w-5/6" />
                        <div className="h-4 bg-stone-800/60 rounded animate-pulse w-4/6" />
                      </div>
                    ) : (
                      <p className="text-stone-500 italic text-sm">
                        No description available. Visit BoardGameGeek for more information.
                      </p>
                    )}
                  </section>

                  {/* Categories & Mechanics */}
                  {((game.genres && game.genres.length > 0) || (game.categories && game.categories.length > 0) || (game.mechanics && game.mechanics.length > 0)) && (
                    <section className="space-y-3">
                      {((game.genres && game.genres.length > 0) || (game.categories && game.categories.length > 0)) && (
                        <div>
                          <h3 className="text-[11px] font-semibold text-amber-200/70 mb-2 uppercase tracking-widest font-serif">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {(game.genres || game.categories || []).slice(0, 8).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-stone-900/70 border border-amber-900/50 rounded text-xs text-amber-100/85"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {game.mechanics && game.mechanics.length > 0 && (
                        <div>
                          <h3 className="text-[11px] font-semibold text-amber-200/70 mb-2 uppercase tracking-widest font-serif">
                            Mechanics
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {game.mechanics.slice(0, 8).map((mechanic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-stone-900/70 border border-amber-900/50 rounded text-xs text-amber-100/85"
                              >
                                {mechanic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* External links */}
                  <section className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-amber-900/30">
                    <a
                      href={amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-lg font-serif font-semibold text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Buy on Amazon</span>
                    </a>

                    {game.bggId && (
                      <a
                        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif font-semibold text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View on BGG</span>
                      </a>
                    )}

                    {onRemove && (
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const ok = window.confirm(`Remove "${game.name}" from thy library?`);
                            if (!ok) return;
                          }
                          onRemove(game.id);
                          onClose();
                        }}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg font-serif font-semibold text-sm transition-colors"
                        aria-label="Remove from library"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove from Library</span>
                      </button>
                    )}
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-900/70 border border-amber-900/40 rounded-lg">
      {icon}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] text-stone-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-semibold text-amber-100">{value}</span>
      </div>
    </div>
  );
}

interface QuickStartPanelProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onSwitchTo: (panel: ActivePanel) => void;
}

function QuickStartPanel({ game, isOpen, onClose, onSwitchTo }: QuickStartPanelProps) {
  const router = useRouter();
  const setGame = usePlaySessionStore((s) => s.setGame);
  const setPlayers = usePlaySessionStore((s) => s.setPlayers);
  const setStep = usePlaySessionStore((s) => s.setStep);

  const minPlayers = game.minPlayers ?? 1;
  const maxPlayers = game.maxPlayers ?? 8;

  const [playerCount, setPlayerCount] = useState(() =>
    Math.max(minPlayers, Math.min(maxPlayers, 2)),
  );
  const [skipRulebook, setSkipRulebook] = useState(false);
  const [wantDeep, setWantDeep] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlayerCount(Math.max(minPlayers, Math.min(maxPlayers, 2)));
      setSkipRulebook(false);
      setWantDeep(false);
    }
  }, [isOpen, minPlayers, maxPlayers]);

  const decrement = () => setPlayerCount((c) => Math.max(minPlayers, c - 1));
  const increment = () => setPlayerCount((c) => Math.min(maxPlayers, c + 1));

  const handleStart = () => {
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i + 1}-${Date.now()}`,
      name: `Player ${i + 1}`,
    }));

    setGame(game);
    setPlayers(players);
    setStep('setup');

    if (skipRulebook) {
      onSwitchTo('teach');
      return;
    }
    if (wantDeep) {
      onSwitchTo('deep');
      return;
    }

    onClose();
    router.push('/play');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="quickstart-panel"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full overflow-hidden"
        >
          <div className="rounded-2xl bg-stone-900 border border-amber-900/50 p-4 sm:p-5 space-y-4 shadow-xl shadow-amber-900/10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-amber-200/60 font-serif">
                    How many players?
                  </p>
                  {minPlayers && maxPlayers && (
                    <p className="text-[11px] text-stone-500 italic">
                      {minPlayers}–{maxPlayers} supported
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={decrement}
                    disabled={playerCount <= minPlayers}
                    className="p-2 rounded-lg bg-stone-950 border border-amber-900/50 text-amber-200 hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Fewer players"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-12 text-center">
                    <span className="text-2xl font-serif font-bold text-amber-100">
                      {playerCount}
                    </span>
                  </div>
                  <button
                    onClick={increment}
                    disabled={playerCount >= maxPlayers}
                    className="p-2 rounded-lg bg-stone-950 border border-amber-900/50 text-amber-200 hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="More players"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ToggleRow
                icon={<BookOpenCheck className="w-4 h-4 text-amber-300" />}
                label="Skip the rulebook?"
                description="The Tome will teach the table before we start."
                value={skipRulebook}
                onChange={setSkipRulebook}
              />

              <ToggleRow
                icon={<Swords className="w-4 h-4 text-amber-300" />}
                label="Want deep strategy first?"
                description="Openings, mid-game pivots, and counters."
                value={wantDeep}
                onChange={setWantDeep}
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
            >
              {skipRulebook ? (
                <>
                  <BookOpenCheck className="w-5 h-5" />
                  <span>Teach us, then we play</span>
                </>
              ) : wantDeep ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Show strategy, then we play</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start playing</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
        value
          ? 'bg-amber-500/10 border-amber-500/50'
          : 'bg-stone-950/60 border-amber-900/40 hover:border-amber-500/40',
      )}
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-stone-900 border border-amber-900/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-serif font-semibold text-amber-100">{label}</div>
        <div className="text-[11px] text-stone-400 italic font-serif leading-snug">
          {description}
        </div>
      </div>
      <div
        className={cn(
          'shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors',
          value ? 'bg-amber-500' : 'bg-stone-700',
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full bg-stone-950 transition-transform',
            value ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </div>
    </button>
  );
}
