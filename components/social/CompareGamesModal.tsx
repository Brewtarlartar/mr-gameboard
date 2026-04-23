'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  X,
  Users,
  Star,
  Clock,
  Target,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  Check,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Game } from '@/types/game';
import { decodeHtmlEntities } from '@/lib/text/decodeHtml';
import { readApiError } from '@/lib/ai/readApiError';

interface CompareGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
}

interface GameAnalysis {
  gameId: string;
  pros: string[];
  cons: string[];
  isLoading: boolean;
}

type View = 'picking' | 'comparing';

export default function CompareGamesModal({ isOpen, onClose, games: allGames }: CompareGamesModalProps) {
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [gameAnalyses, setGameAnalyses] = useState<Map<string, GameAnalysis>>(new Map());
  const [view, setView] = useState<View>('picking');
  const [mounted, setMounted] = useState(false);

  // Mark mounted so portal can attach to document.body (avoids SSR hydration issues)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const toggleGame = (game: Game) => {
    if (selectedGames.find((g) => g.id === game.id)) {
      const remaining = selectedGames.filter((g) => g.id !== game.id);
      setSelectedGames(remaining);
      const newAnalyses = new Map(gameAnalyses);
      newAnalyses.delete(game.id);
      setGameAnalyses(newAnalyses);
      // If we drop below 2 games while comparing, fall back to the picker so
      // the user can pick a replacement (Compare needs at least 2 games).
      if (view === 'comparing' && remaining.length < 2) {
        setView('picking');
      }
    } else if (selectedGames.length < 6) {
      setSelectedGames([...selectedGames, game]);
      // Eagerly start the AI analysis in the background so it's ready as soon
      // as the user hits Compare. If they later deselect, we drop the result.
      generateGameAnalysis(game);
    }
  };

  // Begin comparing — switches to the comparison view. Selections are
  // preserved so the user can come back to the picker and tweak.
  const handleStartCompare = () => {
    if (selectedGames.length < 2) return;
    // Make sure every selected game has an analysis in flight or done.
    selectedGames.forEach((g) => {
      if (!gameAnalyses.has(g.id)) generateGameAnalysis(g);
    });
    setView('comparing');
    // Scroll back to top so the user lands on the first comparison card.
    requestAnimationFrame(() => {
      document
        .getElementById('compare-modal-body')
        ?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const generateGameAnalysis = async (game: Game) => {
    setGameAnalyses((prev) =>
      new Map(prev).set(game.id, {
        gameId: game.id,
        pros: [],
        cons: [],
        isLoading: true,
      })
    );

    try {
      const userPrompt = `For a game night, give me exactly 3 pros and 3 cons for playing "${game.name}".
Consider: player count (${game.minPlayers}-${game.maxPlayers}), playtime (${game.playingTime || 'unknown'} min), complexity (${game.complexity || 'unknown'}/5), and mechanics (${game.mechanics?.join(', ') || 'various'}).
Format your response as:
PROS:
- [pro 1]
- [pro 2]
- [pro 3]

CONS:
- [con 1]
- [con 2]
- [con 3]`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) throw new Error(await readApiError(response));
      if (!response.body) throw new Error('Failed to generate analysis');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }
      const analysis = parseProsCons(accumulated);

      setGameAnalyses((prev) =>
        new Map(prev).set(game.id, {
          gameId: game.id,
          pros: analysis.pros,
          cons: analysis.cons,
          isLoading: false,
        })
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI error';
      const isRateLimit = msg.startsWith('The Tome') || msg.startsWith('Thou');
      console.error('[Game Analysis] Error:', error);
      setGameAnalyses((prev) =>
        new Map(prev).set(game.id, {
          gameId: game.id,
          pros: isRateLimit
            ? ['Try again in a moment']
            : ['Great gameplay', 'Popular choice', 'Well-designed'],
          cons: isRateLimit ? [msg] : ['Analysis unavailable', 'Try again later', 'AI error'],
          isLoading: false,
        })
      );
    }
  };

  const parseProsCons = (text: string): { pros: string[]; cons: string[] } => {
    const pros: string[] = [];
    const cons: string[] = [];

    const lines = text.split('\n');
    let currentSection: 'pros' | 'cons' | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().includes('PROS:')) {
        currentSection = 'pros';
      } else if (trimmed.toUpperCase().includes('CONS:')) {
        currentSection = 'cons';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const item = trimmed.substring(1).trim();
        if (item && currentSection === 'pros' && pros.length < 3) {
          pros.push(item);
        } else if (item && currentSection === 'cons' && cons.length < 3) {
          cons.push(item);
        }
      }
    }

    if (pros.length === 0) pros.push('Great game mechanics', 'Popular choice', 'Engaging gameplay');
    if (cons.length === 0) cons.push('May require setup time', 'Learning curve', 'Storage space needed');

    return { pros, cons };
  };

  // While in the comparison view, the primary action returns to the picker
  // (selections are preserved so the user can tweak and re-compare). On the
  // picker, it closes the modal entirely. Esc and backdrop always close.
  const handlePrimaryDismiss = () => {
    if (view === 'comparing') {
      setView('picking');
      requestAnimationFrame(() => {
        document
          .getElementById('compare-modal-body')
          ?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const isSelected = (gameId: string) => selectedGames.some((g) => g.id === gameId);
  const isComparing = view === 'comparing';
  const canCompare = selectedGames.length >= 2;

  // Render via portal so the modal escapes any ancestor stacking contexts
  // (the app's #main-scroll wrapper is `position: fixed; z-index: 10`,
  // which would otherwise trap the modal underneath the top navigation bar).
  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-games-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-7xl my-4 sm:my-8 flex flex-col max-h-[95vh]"
      >
        {/* Header — sticky so the close button is always reachable */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-stone-950/95 backdrop-blur-sm border-b border-amber-900/40 rounded-t-2xl">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center overflow-hidden">
              <Image
                src="/crystal-ball.png"
                alt=""
                width={32}
                height={32}
                className="object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
              />
            </div>
            <div className="min-w-0">
              <h2
                id="compare-games-title"
                className="text-xl sm:text-2xl font-serif font-bold text-amber-100"
              >
                Compare Games
              </h2>
              <p className="text-amber-200/60 text-[11px] sm:text-sm font-serif italic whitespace-nowrap overflow-hidden">
                {isComparing
                  ? `Comparing ${selectedGames.length} ${selectedGames.length === 1 ? 'game' : 'games'}`
                  : selectedGames.length === 0
                  ? 'Up to 6 tomes, side-by-side'
                  : `${selectedGames.length} of 6 selected`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isComparing ? (
              <button
                onClick={handlePrimaryDismiss}
                aria-label="Back to game picker"
                title="Back to game picker"
                className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-stone-800 border border-amber-900/40 text-amber-100 rounded-lg text-sm font-serif transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to picker</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                aria-label="Close compare games"
                title="Close (Esc)"
                className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg text-sm font-serif transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Body — the only scroll container */}
        <div id="compare-modal-body" className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          {/* Game picker — shown only in the picker view */}
          {!isComparing && (
            <section id="compare-game-picker">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-serif font-semibold text-amber-200/90">
                  {selectedGames.length === 0
                    ? 'Select games to compare'
                    : selectedGames.length === 1
                    ? 'Pick at least one more to compare'
                    : `${selectedGames.length} games chosen — pick more or hit Compare`}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {allGames.map((game) => {
                  const selected = isSelected(game.id);
                  const disabled = !selected && selectedGames.length >= 6;
                  return (
                    <button
                      key={game.id}
                      onClick={() => toggleGame(game)}
                      disabled={disabled}
                      className={`relative p-2.5 rounded-lg text-left transition-all border ${
                        selected
                          ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-stone-900/60 border-amber-900/30 hover:border-amber-500/40 hover:bg-stone-900/90'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow">
                          <Check className="w-3 h-3 text-stone-950" strokeWidth={3} />
                        </span>
                      )}
                      <div className="text-sm font-serif font-semibold text-amber-100 pr-6 break-words leading-snug">
                        {game.name}
                      </div>
                      <div className="text-[11px] text-amber-200/60 mt-1 italic">
                        {game.minPlayers}-{game.maxPlayers} players
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!isComparing && selectedGames.length === 0 && (
            <div className="text-center py-10 border border-dashed border-amber-900/40 rounded-xl bg-stone-900/30">
              <Users className="w-12 h-12 text-amber-700/60 mx-auto mb-3" />
              <p className="text-amber-200/70 font-serif italic">
                Pick at least two games above to begin thy comparison.
              </p>
            </div>
          )}

          {/* Comparison cards — one card per selected game, fully visible */}
          {isComparing && selectedGames.length > 0 && (
            <section>
              <h3 className="mb-3 font-serif font-semibold text-amber-100 text-base sm:text-lg leading-snug break-words">
                {selectedGames.map((g, i) => (
                  <span key={g.id}>
                    {i > 0 && (
                      <span className="mx-2 text-amber-500/70 italic font-normal">
                        vs
                      </span>
                    )}
                    {g.name}
                  </span>
                ))}
              </h3>

              <div
                className={`grid gap-4 ${
                  selectedGames.length === 1
                    ? 'grid-cols-1'
                    : selectedGames.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {selectedGames.map((game) => {
                  const analysis = gameAnalyses.get(game.id);
                  return (
                    <article
                      key={game.id}
                      className="flex flex-col bg-stone-900/70 border border-amber-900/40 rounded-xl shadow-lg shadow-black/30"
                    >
                      {/* Card header — sticks to the top of the modal body
                          while you scroll through this game's details, so it's
                          always clear which game you're looking at. As you
                          scroll past this card to the next one, that card's
                          header takes over. */}
                      <header className="sticky top-0 z-10 flex items-start gap-3 p-4 border-b border-amber-900/30 bg-stone-950/95 backdrop-blur-sm rounded-t-xl">
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-stone-800 border border-amber-900/30">
                          {game.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={game.image}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🎲
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-serif font-bold text-amber-100 leading-tight break-words">
                            {game.name}
                          </h4>
                          {game.yearPublished && (
                            <p className="text-xs text-amber-200/60 mt-0.5 italic">
                              {game.yearPublished}
                            </p>
                          )}
                          <button
                            onClick={() => toggleGame(game)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Remove from comparison
                          </button>
                        </div>
                      </header>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-px bg-amber-900/20 border-b border-amber-900/30">
                        <Stat
                          icon={Users}
                          label="Players"
                          value={`${game.minPlayers}-${game.maxPlayers}`}
                        />
                        <Stat
                          icon={Clock}
                          label="Play Time"
                          value={game.playingTime ? `${game.playingTime} min` : 'N/A'}
                        />
                        <Stat
                          icon={Target}
                          label="Complexity"
                          value={game.complexity ? `${game.complexity.toFixed(1)}/5` : 'N/A'}
                        />
                        <Stat
                          icon={Star}
                          label="BGG Rating"
                          value={game.rating ? `${game.rating.toFixed(1)}/10` : 'N/A'}
                        />
                      </div>

                      {/* Tags */}
                      {(game.genres?.length || game.mechanics?.length) ? (
                        <div className="px-4 py-3 space-y-2 border-b border-amber-900/30">
                          {game.genres && game.genres.length > 0 && (
                            <TagRow label="Genres" items={game.genres.slice(0, 4)} tone="amber" />
                          )}
                          {game.mechanics && game.mechanics.length > 0 && (
                            <TagRow label="Mechanics" items={game.mechanics.slice(0, 4)} tone="teal" />
                          )}
                        </div>
                      ) : null}

                      {/* Description */}
                      <div className="px-4 py-3 border-b border-amber-900/30">
                        <p className="text-[11px] uppercase tracking-wide text-amber-200/60 font-serif mb-1.5">
                          Description
                        </p>
                        <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                          {game.description
                            ? decodeHtmlEntities(game.description)
                            : 'No description available.'}
                        </p>
                      </div>

                      {/* Pros / Cons (AI) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-amber-900/20 rounded-b-xl overflow-hidden">
                        <div className="p-4 bg-emerald-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-serif font-semibold text-emerald-200 uppercase tracking-wide">
                              Pros
                            </span>
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </div>
                          {analysis?.isLoading ? (
                            <div className="flex items-center gap-2 text-emerald-300/70 text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Analyzing…
                            </div>
                          ) : (
                            <ul className="space-y-1.5">
                              {analysis?.pros.map((pro, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-emerald-100/90 flex items-start gap-2"
                                >
                                  <span className="text-emerald-400 mt-0.5">✓</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="p-4 bg-rose-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsDown className="w-4 h-4 text-rose-400" />
                            <span className="text-xs font-serif font-semibold text-rose-200 uppercase tracking-wide">
                              Cons
                            </span>
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </div>
                          {analysis?.isLoading ? (
                            <div className="flex items-center gap-2 text-rose-300/70 text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Analyzing…
                            </div>
                          ) : (
                            <ul className="space-y-1.5">
                              {analysis?.cons.map((con, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-rose-100/90 flex items-start gap-2"
                                >
                                  <span className="text-rose-400 mt-0.5">✗</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Inline "Add or swap a game" tile — returns to the picker
                    so the user can add or swap games and then re-Compare. */}
                {selectedGames.length < 6 && (
                  <button
                    onClick={handlePrimaryDismiss}
                    className="min-h-[220px] flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-amber-900/50 hover:border-amber-500/60 bg-stone-900/30 hover:bg-amber-500/5 text-amber-200/70 hover:text-amber-100 transition-colors font-serif"
                    aria-label="Add another game to comparison"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm">Add or swap a game</span>
                    <span className="text-[11px] italic opacity-70">
                      {selectedGames.length} of 6 selected
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 sm:px-6 py-3 bg-stone-950/95 backdrop-blur-sm border-t border-amber-900/40 rounded-b-2xl flex items-center justify-end gap-2">
          {isComparing ? (
            <>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap bg-stone-800/70 hover:bg-stone-800 border border-amber-900/40 text-amber-100 rounded-lg text-sm font-serif transition-colors"
              >
                <X className="w-4 h-4" />
                Leave
              </button>
              <button
                onClick={handlePrimaryDismiss}
                className="flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-lg text-sm font-serif transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap bg-stone-800/70 hover:bg-stone-800 border border-amber-900/40 text-amber-100 rounded-lg text-sm font-serif transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
              <button
                onClick={handleStartCompare}
                disabled={!canCompare}
                title={canCompare ? 'Compare selected games' : 'Pick at least 2 games'}
                className="flex items-center justify-center gap-2 px-4 py-2 h-10 whitespace-nowrap bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-100 rounded-lg text-sm font-serif transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500/20"
              >
                <Image
                  src="/crystal-ball.png"
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                />
                Compare
                {selectedGames.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-amber-500/30 text-amber-50 text-[11px] font-bold">
                    {selectedGames.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-stone-900/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-amber-200/60 text-[10px] uppercase tracking-wide font-serif">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-semibold text-amber-100 mt-0.5">{value}</div>
    </div>
  );
}

function TagRow({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: 'amber' | 'teal';
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-500/10 text-amber-200 border-amber-500/30'
      : 'bg-teal-500/10 text-teal-200 border-teal-500/30';
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-amber-200/60 font-serif mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 text-[11px] rounded-full border ${toneClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
