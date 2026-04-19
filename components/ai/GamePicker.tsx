'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';

interface Props {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}

export default function GamePicker({ value, onChange, placeholder = 'Which game?' }: Props) {
  const { games } = useGameStore();
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!value.trim()) return games.slice(0, 5);
    const q = value.toLowerCase();
    return games.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 5);
  }, [value, games]);

  const showList = focused && suggestions.length > 0 && games.length > 0;

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
          placeholder={placeholder}
          className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
        />
      </div>
      {showList && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-stone-800 border border-stone-700 rounded-xl shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((g) => (
            <button
              key={g.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(g.name);
                setFocused(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-stone-200 hover:bg-stone-700 transition-colors"
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
