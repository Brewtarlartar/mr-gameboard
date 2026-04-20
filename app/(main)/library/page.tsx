'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Filter } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';
import GameSearch from '@/components/library/GameSearch';
import CategoryScroller from '@/components/library/CategoryScroller';
import GameDetail from '@/components/library/GameDetail';
import Recommendations from '@/components/library/Recommendations';
import BrowseCatalog from '@/components/library/BrowseCatalog';
import CustomGameForm from '@/components/library/CustomGameForm';
import CompareGamesModal from '@/components/social/CompareGamesModal';
import OracleChoiceModal from '@/components/library/OracleChoiceModal';
import { initializeResearchAgent, getTrendingData } from '@/lib/agents/research/scheduler';
import { generateCategories } from '@/lib/agents/library/categories';
import { enrichGamesWithTrending } from '@/lib/agents/library/sync';

type LibraryFilter = 'all' | 'favorites';

export default function LibraryPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [showOracleModal, setShowOracleModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [trendingData, setTrendingData] = useState<any>(null);
  const [enrichedGames, setEnrichedGames] = useState<Game[]>([]);
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const { games, favorites, loadLibrary, addGame, removeGame, toggleFavorite, autoEnrichLibrary } = useGameStore();

  useEffect(() => {
    loadLibrary();
    initializeResearchAgent();
    getTrendingData().then(setTrendingData);

    const handleTrendingUpdate = () => {
      getTrendingData().then(setTrendingData);
    };

    window.addEventListener('trending-updated', handleTrendingUpdate);
    return () => window.removeEventListener('trending-updated', handleTrendingUpdate);
  }, [loadLibrary]);

  useEffect(() => {
    if (games.length > 0) {
      const timer = setTimeout(() => {
        autoEnrichLibrary();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [games.length, autoEnrichLibrary]);

  useEffect(() => {
    if (trendingData && games.length > 0) {
      setEnrichedGames(enrichGamesWithTrending(games, trendingData));
    } else {
      setEnrichedGames(games);
    }
  }, [games, trendingData]);

  const filteredGames = useMemo(() => {
    if (filter === 'favorites') return enrichedGames.filter(g => favorites.includes(g.id));
    return enrichedGames;
  }, [enrichedGames, favorites, filter]);

  const categories = useMemo(() => {
    if (filteredGames.length === 0) return [];
    return generateCategories(filteredGames, favorites, trendingData);
  }, [filteredGames, favorites, trendingData]);

  const handleSearchSelect = async (bggId: number) => {
    setIsAddingGame(true);
    try {
      const response = await fetch(`/api/bgg/game/${bggId}`);
      if (response.ok) {
        const data = await response.json();
        addGame(data.game);
      }
    } catch (error) {
      console.error('Error adding game:', error);
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setIsDetailOpen(true);
  };

  const handleToggleFavorite = (gameId: string) => {
    toggleFavorite(gameId);
    if (selectedGame?.id === gameId) {
      setSelectedGame({ ...selectedGame, isFavorite: !selectedGame.isFavorite });
    }
  };

  const filterButton = (value: LibraryFilter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
        filter === value
          ? 'bg-amber-500/20 text-amber-100 border border-amber-500/50'
          : 'bg-stone-900/60 text-stone-300 border border-amber-900/40 hover:border-amber-500/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pt-28 md:pt-32">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
              Thy Library
            </h1>
            <p className="text-amber-200/70 text-sm font-serif italic">
              {games.length} {games.length === 1 ? 'tome' : 'tomes'} in thy collection
            </p>
          </div>
          {isAddingGame && (
            <div className="hidden md:flex items-center gap-2 text-amber-300 text-sm shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding…
            </div>
          )}
        </div>

        {/* Action buttons — always on a single row. On mobile each button is
            an icon-over-label tile so the full labels stay readable. On md+
            they collapse to inline icon+label buttons aligned right. The
            generous top margin keeps the icons clear of the title block
            above them on smaller screens. */}
        <div
          className={`mt-4 grid gap-2 md:flex md:flex-wrap md:justify-end md:items-center ${
            games.length > 0 ? 'grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {games.length > 0 && (
            <>
              <button
                onClick={() => setShowOracleModal(true)}
                title="Let the Oracle pick a game from thy library"
                aria-label="Pick a random game from thy library"
                className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-2.5 md:py-2 bg-stone-900/70 hover:bg-stone-800 text-amber-100 rounded-lg transition-colors border border-amber-900/50 text-xs md:text-sm font-serif text-center leading-tight"
              >
                <Image
                  src="/tome-book.png"
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 md:w-5 md:h-5 shrink-0 object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                />
                <span>Pick for Me</span>
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                title="Compare two games side by side"
                aria-label="Compare two games side by side"
                className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-2.5 md:py-2 bg-stone-900/70 hover:bg-stone-800 text-amber-100 rounded-lg transition-colors border border-amber-900/50 text-xs md:text-sm font-serif text-center leading-tight"
              >
                <Image
                  src="/crystal-ball.png"
                  alt=""
                  width={24}
                  height={24}
                  className="w-6 h-6 md:w-5 md:h-5 shrink-0 object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]"
                />
                <span>Compare Games</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowCustomForm(true)}
            title="Manually add a game not found on BoardGameGeek"
            aria-label="Add a custom game manually"
            className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-2.5 md:py-2 bg-stone-900/70 hover:bg-stone-800 text-amber-100 rounded-lg transition-colors border border-amber-900/50 text-xs md:text-sm font-serif text-center leading-tight"
          >
            <Image
              src="/map.png"
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 md:w-5 md:h-5 shrink-0 object-contain drop-shadow-[0_0_4px_rgba(251,191,36,0.4)] [filter:sepia(1)_saturate(3)_hue-rotate(-10deg)_brightness(0.95)]"
            />
            <span>Add Game</span>
          </button>
        </div>

        {isAddingGame && (
          <div className="mt-3 md:hidden flex items-center gap-2 text-amber-300 text-xs font-serif italic">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Adding game to thy library…
          </div>
        )}
      </div>

      <div className="space-y-2">
        <GameSearch onSelectGame={handleSearchSelect} />
        <p className="text-[11px] text-amber-200/50 italic font-serif px-1">
          Or scroll down to browse the catalog and add games by category.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-amber-500/70" />
        {filterButton('all', `All (${games.length})`)}
        {filterButton('favorites', `Favorites (${favorites.length})`)}
      </div>

      {games.length === 0 ? (
        <>
          <div className="bg-gradient-to-b from-stone-900/70 to-stone-950/80 border border-amber-900/50 rounded-2xl p-10 sm:p-12 text-center shadow-lg shadow-black/30">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 mb-2">
              Thy library awaits its first tome
            </h2>
            <p className="text-amber-200/70 mb-6 font-serif italic max-w-md mx-auto">
              Search above for any board game on BoardGameGeek and we shall scribe it into thy collection.
            </p>
          </div>
          <Recommendations onGameSelect={handleGameSelect} />
          <BrowseCatalog onGameSelect={handleGameSelect} defaultOpen />
        </>
      ) : filteredGames.length === 0 ? (
        <div className="bg-stone-900/60 border border-amber-900/40 rounded-2xl p-8 text-center">
          <p className="text-stone-400 font-serif italic">No games match this filter.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Favorites + Recently Added first */}
          {categories
            .filter((c) => c.id === 'favorites' || c.id === 'recent')
            .map((category) => (
              <CategoryScroller
                key={category.id}
                title={category.title}
                games={category.games}
                description={category.description}
                onGameSelect={handleGameSelect}
                onToggleFavorite={handleToggleFavorite}
                onRemove={removeGame}
                favorites={favorites}
              />
            ))}

          {/* Recommendations near the top */}
          <Recommendations onGameSelect={handleGameSelect} />

          {/* The rest of the library categories */}
          {categories
            .filter((c) => c.id !== 'favorites' && c.id !== 'recent')
            .map((category) => (
              <CategoryScroller
                key={category.id}
                title={category.title}
                games={category.games}
                description={category.description}
                onGameSelect={handleGameSelect}
                onToggleFavorite={handleToggleFavorite}
                onRemove={removeGame}
                favorites={favorites}
              />
            ))}

          {/* Browse the full catalog to add more */}
          <BrowseCatalog onGameSelect={handleGameSelect} />
        </div>
      )}

      <GameDetail
        game={selectedGame}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedGame ? favorites.includes(selectedGame.id) : false}
        onRemove={
          selectedGame && games.some((g) => g.id === selectedGame.id) ? removeGame : undefined
        }
      />

      {showCustomForm && <CustomGameForm onClose={() => setShowCustomForm(false)} />}

      {showOracleModal && (
        <OracleChoiceModal
          isOpen={showOracleModal}
          games={games}
          onClose={() => setShowOracleModal(false)}
          onSelectGame={handleGameSelect}
        />
      )}

      {showCompareModal && (
        <CompareGamesModal isOpen={showCompareModal} games={games} onClose={() => setShowCompareModal(false)} />
      )}
    </div>
  );
}
