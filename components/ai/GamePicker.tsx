'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';

interface Props {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}

interface Suggestion {
  id: string;
  name: string;
  year?: number | null;
  source: 'library' | 'catalog';
}

const MAX_SUGGESTIONS = 8;

export default function GamePicker({ value, onChange, placeholder = 'Which game?' }: Props) {
  const { games, allDiscoverGames, discoverLoaded, loadDiscoverGames } = useGameStore();
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!discoverLoaded) {
      loadDiscoverGames();
    }
  }, [discoverLoaded, loadDiscoverGames]);

  const corpus = useMemo<Suggestion[]>(() => {
    const seen = new Set<string>();
    const results: Suggestion[] = [];

    for (const g of games) {
      const key = g.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push({ id: `lib:${g.id}`, name: g.name, year: g.yearPublished ?? null, source: 'library' });
    }

    for (const s of allDiscoverGames) {
      const key = s.title.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push({
        id: `cat:${s.bggId}`,
        name: s.title,
        year: s.yearPublished ?? null,
        source: 'catalog',
      });
    }

    return results;
  }, [games, allDiscoverGames]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = value.trim().toLowerCase();
    if (!q) {
      return corpus.filter((c) => c.source === 'library').slice(0, MAX_SUGGESTIONS);
    }

    const starts: Suggestion[] = [];
    const contains: Suggestion[] = [];

    for (const entry of corpus) {
      const lower = entry.name.toLowerCase();
      if (lower.startsWith(q)) {
        starts.push(entry);
      } else if (lower.includes(q)) {
        contains.push(entry);
      }
      if (starts.length >= MAX_SUGGESTIONS) break;
    }

    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [value, corpus]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, focused]);

  const showList = focused && suggestions.length > 0;

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    setFocused(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls="game-picker-listbox"
        />
      </div>
      {showList && (
        <ul
          id="game-picker-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 bg-stone-800 border border-stone-700 rounded-xl shadow-xl z-10 overflow-hidden max-h-72 overflow-y-auto"
        >
          {suggestions.map((s, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={s.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                    isActive ? 'bg-stone-700 text-amber-100' : 'text-stone-200 hover:bg-stone-700'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {s.year ? (
                      <span className="text-[10px] text-stone-500 font-serif italic">
                        ({s.year})
                      </span>
                    ) : null}
                    {s.source === 'library' ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">
                        Library
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
