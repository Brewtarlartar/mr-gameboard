'use client';

/**
 * Supervised review of AI-found rulebook link candidates. Not linked from any
 * nav — visit /admin/rulebooks directly. Requires the CRON_SECRET admin token
 * (asked once, kept in sessionStorage). Approving denormalizes the link into
 * the cache so the game's Rulebook button serves it immediately.
 */

import { useCallback, useEffect, useState } from 'react';
/* eslint-disable @next/next/no-img-element */
import { BookOpenCheck, Check, ExternalLink, Loader2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Candidate {
  id: string;
  bgg_id: number;
  url: string;
  source_type: string;
  label: string | null;
  game: { name: string; thumbnail: string | null; rank: number | null } | null;
}

const TOKEN_KEY = 'tome-admin-token';

export default function RulebookReviewPage() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
    } catch {}
  }, []);

  const load = useCallback(async (tok: string) => {
    setError(null);
    const res = await fetch('/api/admin/rulebook-links', {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.status === 401) {
      setError('That token was refused.');
      setToken('');
      try {
        sessionStorage.removeItem(TOKEN_KEY);
      } catch {}
      return;
    }
    if (!res.ok) {
      setError('Could not load candidates.');
      return;
    }
    const body = await res.json();
    setCandidates(body.pending as Candidate[]);
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const submitToken = () => {
    const tok = tokenInput.trim();
    if (!tok) return;
    try {
      sessionStorage.setItem(TOKEN_KEY, tok);
    } catch {}
    setToken(tok);
  };

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/rulebook-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setCandidates((prev) => (prev ?? []).filter((c) => c.id !== id));
        setDone((n) => n + 1);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-amber-100 leading-tight flex items-center gap-3">
          <BookOpenCheck className="w-7 h-7 text-amber-400" />
          Rulebook Link Review
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic mt-1">
          Open each link, confirm it is the official rulebook, approve or reject.
          Approved links serve on the game&apos;s Rulebook button immediately.
        </p>
      </div>

      {!token ? (
        <Card className="p-5 space-y-3 max-w-md">
          <p className="text-sm font-serif text-ink-muted/85">Enter the admin token to begin.</p>
          <Input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitToken();
            }}
            placeholder="Admin token (CRON_SECRET)"
            aria-label="Admin token"
          />
          {error && <p className="text-sm font-serif text-danger">{error}</p>}
          <Button onClick={submitToken} disabled={!tokenInput.trim()}>
            Unlock
          </Button>
        </Card>
      ) : candidates === null ? (
        <div className="flex items-center gap-2 text-amber-200/80 font-serif">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading candidates…
        </div>
      ) : candidates.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-serif text-ink">
            No candidates awaiting review{done > 0 ? ` — ${done} decided this sitting` : ''}.
          </p>
          <p className="text-sm font-serif text-ink-muted/70 mt-1">
            Run <code>node scripts/seed-rulebook-links.js --limit 25</code> to research the next batch.
          </p>
        </Card>
      ) : (
        <>
          <p className="text-sm font-serif text-amber-200/70">
            {candidates.length} awaiting review{done > 0 ? ` · ${done} decided` : ''}
          </p>
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li key={c.id}>
                <Card className="p-4 flex items-start gap-4">
                  {c.game?.thumbnail ? (
                    <img
                      src={c.game.thumbnail}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-edge/60 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-surface-high border border-edge/60 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-serif font-semibold text-ink">
                      {c.game?.rank ? `#${c.game.rank} · ` : ''}
                      {c.game?.name ?? `BGG ${c.bgg_id}`}
                      <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-muted/60">
                        {c.source_type.replace('_', ' ')}
                      </span>
                    </p>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-gold-strong break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {c.url}
                    </a>
                    {c.label && (
                      <p className="text-xs font-serif italic text-ink-muted/70">{c.label}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => decide(c.id, 'approve')}
                      disabled={busyId === c.id}
                      aria-label={`Approve link for ${c.game?.name ?? c.bgg_id}`}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => decide(c.id, 'reject')}
                      disabled={busyId === c.id}
                      aria-label={`Reject link for ${c.game?.name ?? c.bgg_id}`}
                    >
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
