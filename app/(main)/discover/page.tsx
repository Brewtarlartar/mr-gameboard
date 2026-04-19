'use client';

import DiscoverGames from '@/components/library/DiscoverGames';

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-100 mb-1">Discover</h1>
        <p className="text-stone-400 text-sm">Browse curated lists of board games and add them to your library.</p>
      </div>
      <DiscoverGames />
    </div>
  );
}
