'use client';

import { useEffect } from 'react';

import AICompanionSection from '@/components/ai/AICompanionSection';
import { useGameStore } from '@/lib/store/gameStore';

export default function HomePage() {
  const { loadLibrary } = useGameStore();

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  return (
    <div className="flex flex-col pt-[14vh] pb-6">
      <AICompanionSection />
    </div>
  );
}
