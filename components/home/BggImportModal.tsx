'use client';

import { useState } from 'react';
import { Loader2, Library } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGameStore } from '@/lib/store/gameStore';
import type { SeedGame } from '@/types/seedGame';
import type { BggCollectionItem } from '@/lib/bgg/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function toSeedGame(item: BggCollectionItem): SeedGame {
  return {
    bggId: String(item.bggId),
    title: item.name,
    description: '',
    image: item.image,
    thumbnail: item.thumbnail,
    yearPublished: item.yearPublished,
    minPlayers: item.minPlayers,
    maxPlayers: item.maxPlayers,
    playingTime: item.playingTime,
    minPlayTime: null,
    maxPlayTime: null,
    minAge: null,
    rating: item.rating,
    weight: null,
    categories: [],
    mechanics: [],
    designers: [],
    publishers: [],
    rank: item.rank ?? 0,
  };
}

export default function BggImportModal({ isOpen, onClose }: Props) {
  const { games, addGameFromSeed } = useGameStore();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleImport = async () => {
    const name = username.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/bgg/collection?username=${encodeURIComponent(name)}`);
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error ?? 'Import failed. Try again shortly.');
        return;
      }
      const items = body.items as BggCollectionItem[];
      const owned = new Set(games.map((g) => g.bggId));
      let imported = 0;
      let skipped = 0;
      for (const item of items) {
        if (owned.has(item.bggId)) {
          skipped++;
          continue;
        }
        addGameFromSeed(toSeedGame(item));
        imported++;
        // Each add rewrites the persisted library; yield periodically so a
        // big collection doesn't freeze the UI.
        if (imported % 25 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      setResult({ imported, skipped });
    } catch {
      setError('Import failed. Check thy connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="bgg-import-title" className="max-w-md">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Library className="w-5 h-5 text-gold" />
          <h2 id="bgg-import-title" className="text-lg font-display font-bold text-ink">
            Import thy shelf from BGG
          </h2>
        </div>
        <p className="text-sm font-serif text-ink-muted/85">
          Own games on BoardGameGeek? Enter thy username and thy shelf appears in seconds —
          owned base games only, no expansions.
        </p>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleImport();
          }}
          placeholder="BoardGameGeek username"
          disabled={busy}
          aria-label="BoardGameGeek username"
        />
        {error && <p className="text-sm font-serif text-danger">{error}</p>}
        {result && (
          <p className="text-sm font-serif text-gold">
            {result.imported > 0
              ? `${result.imported} game${result.imported === 1 ? '' : 's'} added to thy library`
              : 'No new games to add'}
            {result.skipped > 0 ? ` · ${result.skipped} already on the shelf` : ''}.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          <Button onClick={handleImport} disabled={!username.trim() || busy}>
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Consulting BGG…
              </>
            ) : (
              'Import collection'
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
