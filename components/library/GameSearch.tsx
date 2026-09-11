'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import Image from 'next/image';
import { Search, Loader2, X, History, Clock, Plus, Link2 } from 'lucide-react';
import {
  debouncedSearch,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} from '@/lib/agents/library/search';
import BggAttribution from '@/components/ui/BggAttribution';

/**
 * Extract a BGG game ID from either a bare numeric string or a full BGG URL
 * (e.g. https://boardgamegeek.com/boardgame/266192/wingspan).
 * Returns null if we can't find one.
 */
function parseBggInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m = trimmed.match(/\/boardgame(?:expansion)?\/(\d+)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

interface GameSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  score?: number;
  thumbnail?: string;
}

interface GameSearchProps {
  onSelectGame: (gameId: number) => void;
}

export default function GameSearch({ onSelectGame }: GameSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // "Have a BGG link?" escape hatch
  const [showBggAdd, setShowBggAdd] = useState(false);
  const [bggInput, setBggInput] = useState('');
  const [bggAdding, setBggAdding] = useState(false);
  const [bggError, setBggError] = useState<string | null>(null);

  const handleBggAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bggAdding) return;

    const bggId = parseBggInput(bggInput);
    if (!bggId) {
      setBggError("Couldn't read a BGG ID from that. Paste a full BGG link or just the numeric ID.");
      return;
    }

    setBggAdding(true);
    setBggError(null);

    try {
      const res = await apiFetch('/api/bgg/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bggId }),
      });
      const data = (await res.json()) as { ok: boolean; bggId?: number; name?: string; error?: string };
      if (!res.ok || !data.ok || !data.bggId) {
        setBggError(data.error || `BoardGameGeek didn't recognize ID ${bggId}.`);
        setBggAdding(false);
        return;
      }

      saveSearchHistory(data.name || String(data.bggId));
      setSearchHistory(getSearchHistory());

      onSelectGame(data.bggId);
      setBggInput('');
      setShowBggAdd(false);
      setQuery('');
      setResults([]);
    } catch (err) {
      setBggError(err instanceof Error ? err.message : 'Network error reaching BGG.');
    } finally {
      setBggAdding(false);
    }
  };

  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowHistory(false);

    debouncedSearch(query, (searchResults) => {
      setResults(searchResults);
      setIsSearching(false);

      if (searchResults.length === 0) {
        setError('No tomes match that title. Try a different search.');
      }
    });
  }, [query]);

  const handleSelectGame = (gameId: number, gameName: string) => {
    saveSearchHistory(gameName);
    setSearchHistory(getSearchHistory());

    onSelectGame(gameId);
    setQuery('');
    setResults([]);
    setShowHistory(false);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    setShowHistory(false);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setSearchHistory([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Image
          src="/Wizard.png"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 object-contain pointer-events-none drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length < 2 && searchHistory.length > 0) {
              setShowHistory(true);
            }
          }}
          placeholder="Search the catalog to add a tome…"
          className="w-full pl-12 pr-10 py-3 bg-stone-900/70 border border-amber-900/50 rounded-xl text-amber-100 placeholder-amber-200/40 font-serif italic text-xs sm:text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setError(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/60 hover:text-amber-100"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!query && searchHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-200/60 hover:text-amber-100"
            title="Search history"
          >
            <History className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="mt-1.5 px-1">
        {!showBggAdd ? (
          <button
            type="button"
            onClick={() => {
              setShowBggAdd(true);
              setBggError(null);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-amber-200/60 hover:text-amber-100 font-serif italic transition-colors"
          >
            <Link2 className="w-3 h-3" />
            <span>Can&rsquo;t find it? Paste a BoardGameGeek link or ID</span>
          </button>
        ) : (
          <form onSubmit={handleBggAdd} className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-200/50 pointer-events-none" />
                <input
                  type="text"
                  value={bggInput}
                  onChange={(e) => {
                    setBggInput(e.target.value);
                    if (bggError) setBggError(null);
                  }}
                  placeholder="https://boardgamegeek.com/boardgame/266192/wingspan  or just  266192"
                  disabled={bggAdding}
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 bg-stone-900/70 border border-amber-900/50 rounded-lg text-amber-100 placeholder-amber-200/30 font-serif italic text-[11px] sm:text-xs focus:outline-none focus:border-amber-500/60 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={!bggInput.trim() || bggAdding}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-serif font-semibold text-xs rounded-lg transition-colors"
              >
                {bggAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBggAdd(false);
                  setBggInput('');
                  setBggError(null);
                }}
                className="inline-flex items-center justify-center px-2 text-amber-200/60 hover:text-amber-100"
                aria-label="Close BGG add"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {bggError && (
              <p className="text-[11px] text-red-300/90 font-serif italic px-1">{bggError}</p>
            )}
          </form>
        )}
      </div>

      {showHistory && searchHistory.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-stone-950 border border-amber-900/50 rounded-xl shadow-xl shadow-black/50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/40">
            <span className="text-[11px] text-amber-200/70 font-serif uppercase tracking-widest">
              Recent searches
            </span>
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-red-300/80 hover:text-red-200"
            >
              Clear
            </button>
          </div>
          <div className="py-1">
            {searchHistory.slice(0, 10).map((term, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(term)}
                className="w-full px-4 py-2 text-left hover:bg-amber-500/10 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-500/70" />
                <span className="text-amber-100 text-sm">{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(results.length > 0 || isSearching || error) && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-stone-950 border border-amber-900/50 rounded-xl shadow-xl shadow-black/50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-amber-200/70 text-sm font-serif italic mt-2">
                Searching the great archives…
              </p>
            </div>
          ) : error ? (
            <div className="p-5 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-amber-500/50" />
              <p className="text-amber-100 text-sm font-serif italic mb-1">{error}</p>
              <p className="text-stone-500 text-xs">
                Try just the first word, or check thy connection.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id, game.name)}
                  className="group w-full px-4 py-3 hover:bg-amber-500/10 transition-colors border-b border-amber-900/30 last:border-b-0 flex items-center gap-3"
                >
                  <div className="w-10 h-10 shrink-0 rounded bg-stone-900 border border-amber-900/40 overflow-hidden flex items-center justify-center">
                    {game.thumbnail ? (
                      <img
                        src={game.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-amber-700 text-lg">🎲</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-serif font-semibold text-amber-100 text-sm truncate">
                      {game.name}
                    </div>
                    {game.yearPublished && (
                      <div className="text-[11px] text-amber-200/60 italic">
                        {game.yearPublished}
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 group-hover:bg-amber-500 group-hover:text-stone-950 border border-amber-500/40 text-amber-100 rounded-md text-xs font-semibold transition-colors">
                    <Plus className="w-3 h-3" />
                    Add
                  </span>
                </button>
              ))}
              <div className="px-4 py-2 border-t border-amber-900/30 text-center">
                <BggAttribution />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
