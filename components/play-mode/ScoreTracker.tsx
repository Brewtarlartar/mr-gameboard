'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Trophy, Crown, Users, Swords, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '@/types/game';
import { SessionMode } from '@/lib/store/playHistoryStore';
import { usePlaySessionStore, ScorePlayerRow } from '@/lib/store/playSessionStore';
import { useHapticFeedback } from '@/lib/hooks/useMobile';

export interface ScoreCategory {
  key: string;
  label: string;
  hint?: string;
  defaultValue?: number;
  step?: number;
}

export interface ScoreTemplate {
  id: string;
  name: string;
  categories: ScoreCategory[];
}

export const SCORE_TEMPLATES: ScoreTemplate[] = [
  {
    id: 'simple',
    name: 'Simple total',
    categories: [{ key: 'score', label: 'Points', step: 1 }],
  },
  {
    id: 'wingspan',
    name: 'Wingspan',
    categories: [
      { key: 'birds', label: 'Birds' },
      { key: 'bonusCards', label: 'Bonus cards' },
      { key: 'endOfRound', label: 'End-of-round goals' },
      { key: 'eggs', label: 'Eggs' },
      { key: 'foodOnCards', label: 'Food on cards' },
      { key: 'tuckedCards', label: 'Tucked cards' },
    ],
  },
  {
    id: 'catan',
    name: 'Catan',
    categories: [
      { key: 'settlements', label: 'Settlements', hint: '1 pt each' },
      { key: 'cities', label: 'Cities', hint: '2 pt each' },
      { key: 'longestRoad', label: 'Longest road', hint: '2 pt' },
      { key: 'largestArmy', label: 'Largest army', hint: '2 pt' },
      { key: 'devCards', label: 'Victory dev cards' },
    ],
  },
  {
    id: 'scythe',
    name: 'Scythe',
    categories: [
      { key: 'stars', label: 'Stars' },
      { key: 'territories', label: 'Territories' },
      { key: 'resources', label: 'Resource pairs' },
      { key: 'structures', label: 'Structure bonus' },
      { key: 'coins', label: 'Coins' },
    ],
  },
  {
    id: 'terraforming-mars',
    name: 'Terraforming Mars',
    categories: [
      { key: 'tr', label: 'Terraform rating' },
      { key: 'milestones', label: 'Milestones' },
      { key: 'awards', label: 'Awards' },
      { key: 'greeneries', label: 'Greeneries' },
      { key: 'cities', label: 'City bonus' },
      { key: 'cards', label: 'Card VP' },
    ],
  },
  {
    id: 'everdell',
    name: 'Everdell',
    categories: [
      { key: 'baseCards', label: 'Base card points' },
      { key: 'events', label: 'Events' },
      { key: 'journey', label: 'Journey' },
      { key: 'prosperity', label: 'Prosperity bonus' },
      { key: 'pearls', label: 'Pearls' },
    ],
  },
  {
    id: 'azul',
    name: 'Azul',
    categories: [
      { key: 'placement', label: 'Placement points' },
      { key: 'rows', label: 'Complete rows', hint: '2 pt each' },
      { key: 'columns', label: 'Complete columns', hint: '7 pt each' },
      { key: 'colors', label: 'Complete colors', hint: '10 pt each' },
      { key: 'penalties', label: 'Floor penalties', step: -1 },
    ],
  },
  {
    id: 'ticket-to-ride',
    name: 'Ticket to Ride',
    categories: [
      { key: 'routes', label: 'Route points' },
      { key: 'ticketsComplete', label: 'Completed tickets' },
      { key: 'ticketsFailed', label: 'Failed tickets', step: -1 },
      { key: 'longestPath', label: 'Longest path', hint: '10 pt' },
      { key: 'stations', label: 'Station bonus' },
    ],
  },
];

const BGG_TEMPLATE_MAP: Record<number, string> = {
  266192: 'wingspan',
  13: 'catan',
  169786: 'scythe',
  167791: 'terraforming-mars',
  199792: 'everdell',
  230802: 'azul',
  9209: 'ticket-to-ride',
};

function matchTemplateForGame(game?: Game | null): ScoreTemplate {
  if (!game) return SCORE_TEMPLATES[0];
  if (game.bggId && BGG_TEMPLATE_MAP[game.bggId]) {
    return SCORE_TEMPLATES.find((t) => t.id === BGG_TEMPLATE_MAP[game.bggId!]) ?? SCORE_TEMPLATES[0];
  }
  const slug = game.name.toLowerCase();
  const byName = SCORE_TEMPLATES.find(
    (t) => t.id !== 'simple' && slug.includes(t.name.toLowerCase())
  );
  return byName ?? SCORE_TEMPLATES[0];
}

interface ScoreTrackerProps {
  game?: Game | null;
}

export default function ScoreTracker({ game }: ScoreTrackerProps = {}) {
  const haptic = useHapticFeedback();
  const scoreState = usePlaySessionStore((s) => s.draft.scoreState);
  const { mode, templateId, players, coopOutcome } = scoreState ?? {
    mode: 'competitive' as SessionMode,
    templateId: 'simple',
    players: [] as ScorePlayerRow[],
    coopOutcome: null,
  };
  const setScoreMode = usePlaySessionStore((s) => s.setScoreMode);
  const setScoreTemplate = usePlaySessionStore((s) => s.setScoreTemplate);
  const setScorePlayers = usePlaySessionStore((s) => s.setScorePlayers);
  const setCoopOutcome = usePlaySessionStore((s) => s.setCoopOutcome);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('A');

  useEffect(() => {
    setScoreTemplate(matchTemplateForGame(game).id);
  }, [game?.bggId, game?.name, setScoreTemplate]);

  const template = useMemo(
    () => SCORE_TEMPLATES.find((t) => t.id === templateId) ?? SCORE_TEMPLATES[0],
    [templateId]
  );

  const totalFor = (player: ScorePlayerRow) =>
    template.categories.reduce((sum, cat) => sum + (player.categories[cat.key] ?? 0), 0);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    haptic.selection();
    setScorePlayers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: newPlayerName.trim(),
        team: mode === 'team' ? newPlayerTeam : undefined,
        categories: {},
      },
    ]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    haptic.selection();
    setScorePlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const bumpCategory = (playerId: string, key: string, delta: number) => {
    haptic.selection();
    setScorePlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              categories: {
                ...p.categories,
                [key]: (p.categories[key] ?? 0) + delta,
              },
            }
          : p
      )
    );
  };

  const setCategory = (playerId: string, key: string, value: number) => {
    setScorePlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              categories: { ...p.categories, [key]: value },
            }
          : p
      )
    );
  };

  const setPlayerTeam = (playerId: string, team: string) => {
    setScorePlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, team } : p)));
  };

  const sortedPlayers = useMemo(() => {
    if (mode === 'coop') return players;
    return [...players].sort((a, b) => totalFor(b) - totalFor(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, template, mode]);

  const teamTotals = useMemo(() => {
    if (mode !== 'team') return [];
    const totals = new Map<string, number>();
    players.forEach((p) => {
      const t = p.team ?? '—';
      totals.set(t, (totals.get(t) ?? 0) + totalFor(p));
    });
    return Array.from(totals.entries())
      .map(([team, total]) => ({ team, total }))
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, template, mode]);

  const leaderId = sortedPlayers[0] && totalFor(sortedPlayers[0]) > 0 ? sortedPlayers[0].id : null;
  const leaderTeam = teamTotals[0] && teamTotals[0].total > 0 ? teamTotals[0].team : null;

  const handleSetMode = (next: SessionMode) => {
    haptic.selection();
    setScoreMode(next);
  };

  return (
    <div className="space-y-4">
      {/* Mode switch */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-stone-950/70 border border-amber-900/40 rounded-xl">
        {[
          { id: 'competitive' as const, label: 'Versus', icon: Swords },
          { id: 'coop' as const, label: 'Co-op', icon: HeartHandshake },
          { id: 'team' as const, label: 'Teams', icon: Users },
        ].map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSetMode(m.id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-serif font-semibold transition-colors ${
                active
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border border-amber-400/40 shadow-md shadow-amber-900/30'
                  : 'text-amber-100/80 hover:text-amber-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Template picker — hidden in co-op */}
      {mode !== 'coop' && (
        <div>
          <select
            value={templateId}
            onChange={(e) => setScoreTemplate(e.target.value)}
            className="w-full px-3 py-2 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
          >
            {SCORE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {game && matchTemplateForGame(game).id === t.id && t.id !== 'simple' ? ' (suggested)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add player */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addPlayer();
            }
          }}
          placeholder={mode === 'coop' ? 'Add teammate...' : 'Player name...'}
          className="flex-1 px-3 py-2.5 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 placeholder:text-amber-200/40 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
        />
        {mode === 'team' && (
          <select
            value={newPlayerTeam}
            onChange={(e) => setNewPlayerTeam(e.target.value)}
            className="px-3 py-2.5 bg-stone-950/70 border border-amber-900/50 rounded-lg text-amber-100 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            {['A', 'B', 'C', 'D'].map((t) => (
              <option key={t} value={t}>
                Team {t}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={addPlayer}
          disabled={!newPlayerName.trim()}
          className="px-3 py-2.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 rounded-lg shadow-md shadow-amber-900/30 transition-colors"
          aria-label="Add player"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Coop: single outcome toggle */}
      {mode === 'coop' && players.length > 0 && (
        <div className="bg-stone-900/60 border border-amber-900/40 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider font-serif text-amber-200/70 mb-2">
            Group outcome
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                haptic.medium();
                setCoopOutcome('win');
              }}
              className={`py-2.5 rounded-lg font-serif font-semibold text-sm transition-colors border ${
                coopOutcome === 'win'
                  ? 'bg-emerald-500/90 text-stone-950 border-emerald-400/40 shadow-md shadow-emerald-900/30'
                  : 'bg-stone-800/70 text-amber-100/80 border-amber-900/40 hover:border-emerald-500/40 hover:text-amber-200'
              }`}
            >
              Victory
            </button>
            <button
              onClick={() => {
                haptic.medium();
                setCoopOutcome('loss');
              }}
              className={`py-2.5 rounded-lg font-serif font-semibold text-sm transition-colors border ${
                coopOutcome === 'loss'
                  ? 'bg-red-500/90 text-stone-50 border-red-400/40 shadow-md shadow-red-900/30'
                  : 'bg-stone-800/70 text-amber-100/80 border-amber-900/40 hover:border-red-500/40 hover:text-amber-200'
              }`}
            >
              Defeat
            </button>
          </div>
        </div>
      )}

      {/* Team totals */}
      {mode === 'team' && teamTotals.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {teamTotals.map((t) => {
            const isLead = t.team === leaderTeam;
            return (
              <div
                key={t.team}
                className={`p-3 rounded-xl border text-center transition-colors ${
                  isLead
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-stone-900/60 border-amber-900/40'
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider font-serif text-amber-200/70">
                  Team {t.team}
                </p>
                <p
                  className={`text-2xl font-serif font-bold tabular-nums ${
                    isLead ? 'text-amber-300' : 'text-amber-100'
                  }`}
                >
                  {t.total}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Player rows */}
      <AnimatePresence>
        {sortedPlayers.length > 0 && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {sortedPlayers.map((player) => {
              const total = totalFor(player);
              const isLeader = mode !== 'coop' && player.id === leaderId;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`rounded-xl border transition-colors ${
                    isLeader
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-stone-900/60 border-amber-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isLeader && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate text-sm ${isLeader ? 'text-amber-200' : 'text-stone-100'}`}>
                          {player.name}
                        </div>
                        {mode === 'team' && (
                          <select
                            value={player.team ?? 'A'}
                            onChange={(e) => setPlayerTeam(player.id, e.target.value)}
                            className="text-[10px] bg-transparent text-stone-400 focus:outline-none"
                          >
                            {['A', 'B', 'C', 'D'].map((t) => (
                              <option key={t} value={t} className="bg-stone-800">
                                Team {t}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {mode !== 'coop' && (
                        <div className={`text-2xl font-bold tabular-nums ${isLeader ? 'text-amber-300' : 'text-stone-100'}`}>
                          {total}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-1.5 text-stone-500 hover:text-red-400 rounded-md transition-colors"
                      aria-label={`Remove ${player.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {mode !== 'coop' && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {template.categories.map((cat) => {
                        const value = player.categories[cat.key] ?? 0;
                        const step = cat.step ?? 1;
                        return (
                          <div key={cat.key} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-stone-300 truncate">{cat.label}</div>
                              {cat.hint && (
                                <div className="text-[10px] text-stone-500 truncate">{cat.hint}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => bumpCategory(player.id, cat.key, -Math.abs(step))}
                                className="w-8 h-8 flex items-center justify-center bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-md active:scale-95 transition-colors"
                                aria-label={`Decrease ${cat.label}`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => setCategory(player.id, cat.key, Number(e.target.value) || 0)}
                                className="w-12 h-8 text-center bg-stone-950/70 border border-amber-900/40 rounded-md text-amber-100 text-sm font-serif tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                              />
                              <button
                                onClick={() => bumpCategory(player.id, cat.key, Math.abs(step))}
                                className="w-8 h-8 flex items-center justify-center bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-md active:scale-95 transition-colors"
                                aria-label={`Increase ${cat.label}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {players.length === 0 && (
        <div className="text-center py-8 text-stone-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Add players to track scores</p>
        </div>
      )}

      {mode === 'coop' && coopOutcome && (
        <p className="text-center text-xs text-stone-400">
          Session recorded as a group {coopOutcome === 'win' ? 'victory' : 'defeat'}.
        </p>
      )}
    </div>
  );
}
