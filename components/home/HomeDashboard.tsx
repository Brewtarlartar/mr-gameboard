'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Dices, Flame, ScrollText, Sparkles, Plus, Library as LibraryIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import OracleChoiceModal from '@/components/library/OracleChoiceModal';
import BggImportModal from '@/components/home/BggImportModal';
import { useGameStore } from '@/lib/store/gameStore';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { usePlaySessionStore } from '@/lib/store/playSessionStore';
import type { Game } from '@/types/game';

/**
 * The game-night dashboard under the wizard console: plan tonight, streak,
 * champion, recent plays. Session-derived numbers render after mount because
 * the play-history store rehydrates from localStorage on the client.
 */
export default function HomeDashboard() {
  const router = useRouter();
  const { games } = useGameStore();
  const sessions = usePlayHistoryStore((s) => s.sessions);
  const { setGame, setStep } = usePlaySessionStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const days = new Set(sessions.map((s) => new Date(s.date).toDateString()));
    let count = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const champion = useMemo(() => {
    const wins = new Map<string, number>();
    for (const s of sessions) {
      if (s.mode === 'coop') continue;
      for (const p of s.players) {
        if (p.isWinner) wins.set(p.name, (wins.get(p.name) ?? 0) + 1);
      }
    }
    let best: { name: string; wins: number } | null = null;
    for (const [name, w] of wins.entries()) {
      if (!best || w > best.wins) best = { name, wins: w };
    }
    return best;
  }, [sessions]);

  const recent = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [sessions],
  );

  const handlePickGame = (game: Game) => {
    setPickerOpen(false);
    setGame(game);
    setStep('setup');
    router.push('/play');
  };

  const hasGames = games.length > 0;
  const hasSessions = mounted && sessions.length > 0;

  return (
    <section className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-4 mt-4 sm:mt-6">
      {!hasGames ? (
        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <LibraryIcon className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-bold text-ink">Stock thy shelf</h2>
          </div>
          <p className="text-sm font-serif text-ink-muted/85">
            The Tome works its magic on the games thou ownest. Add thy first three — or summon
            thy whole BoardGameGeek collection in one incantation.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push('/discover')}>
              <Plus className="w-4 h-4" />
              Add games
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import from BGG
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-display font-bold text-ink">Plan the night</h2>
          </div>
          <p className="text-sm font-serif text-ink-muted/85">
            Players at the table, an hour to spare? Let the Tome choose from thy {games.length}{' '}
            game{games.length === 1 ? '' : 's'}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPickerOpen(true)}>
              <Dices className="w-4 h-4" />
              Choose our game
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import from BGG
            </Button>
          </div>
        </Card>
      )}

      {hasSessions && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard label="Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} icon={<Flame />} />
          <StatCard label="Sessions" value={sessions.length} icon={<ScrollText />} />
          <StatCard
            label="Champion"
            value={champion ? champion.name : '—'}
            icon={<Crown />}
          />
          <StatCard label="Games owned" value={games.length} icon={<Dices />} />
        </div>
      )}

      {hasSessions && (
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-ink uppercase tracking-wider">
              Recent plays
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push('/analytics')}>
              Open the Chronicle
            </Button>
          </div>
          <ul className="space-y-2">
            {recent.map((s) => {
              const winners = s.mode === 'coop'
                ? s.coopOutcome === 'win' ? 'The table won' : 'The game won'
                : s.players.filter((p) => p.isWinner).map((p) => p.name).join(', ');
              return (
                <li
                  key={s.id}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-edge/50 bg-surface-raised/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-serif font-semibold text-ink truncate">{s.gameName}</p>
                    <p className="text-xs font-serif text-ink-muted/70 truncate">
                      {winners ? `${winners} · ` : ''}
                      {new Date(s.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Crown className="w-4 h-4 shrink-0 text-gold/70" aria-hidden />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {mounted && hasGames && sessions.length === 0 && (
        <Card className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <p className="text-sm font-serif text-ink-muted/85">
            No plays scribed yet — thy Chronicle awaits its first tale.
          </p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/play')}>
            Log a play
          </Button>
        </Card>
      )}

      {pickerOpen && (
        <OracleChoiceModal
          isOpen={pickerOpen}
          games={games}
          onClose={() => setPickerOpen(false)}
          onSelectGame={handlePickGame}
        />
      )}
      <BggImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  );
}
