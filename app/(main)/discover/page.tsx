'use client';

import DiscoverGames from '@/components/library/DiscoverGames';

export default function DiscoverPage() {
  return (
    <div className="space-y-6 pt-28 md:pt-32">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          The Catalog
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic mt-1">
          Browse the great archive of games and add new tomes to thy library
        </p>
      </div>

      <DiscoverGames />
    </div>
  );
}
