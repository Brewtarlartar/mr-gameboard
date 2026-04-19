'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Trash2, RotateCcw, AlertTriangle, Heart, Zap, Clock, Users, Brain, Sword, Dice1, Share2, GitCompare, TrendingUp, Sparkles, BookOpen, RefreshCw, Filter, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';
import GameSearch from '@/components/library/GameSearch';
import CategoryScroller from '@/components/library/CategoryScroller';
import GameDetail from '@/components/library/GameDetail';
import Recommendations from '@/components/library/Recommendations';
import BrowseCatalog from '@/components/library/BrowseCatalog';
import CustomGameForm from '@/components/library/CustomGameForm';
import ShareModal from '@/components/social/ShareModal';
import CompareGamesModal from '@/components/social/CompareGamesModal';
import { initializeResearchAgent, getTrendingData } from '@/lib/agents/research/scheduler';
import { generateCategories } from '@/lib/agents/library/categories';
import { enrichGamesWithTrending } from '@/lib/agents/library/sync';

type LibraryFilter = 'all' | 'favorites';

export default function LibraryPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [trendingData, setTrendingData] = useState<any>(null);
  const [enrichedGames, setEnrichedGames] = useState<Game[]>([]);
  const [isEnrichingDescriptions, setIsEnrichingDescriptions] = useState(false);
  const [enrichmentStatus, setEnrichmentStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [showTools, setShowTools] = useState(false);

  const { games, favorites, loadLibrary, addGame, removeGame, toggleFavorite, resetLibrary, autoEnrichLibrary, enrichLibrary, getGamesNeedingEnrichment } = useGameStore();

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

    const agentCategories = generateCategories(filteredGames, favorites, trendingData);

    return agentCategories.map(cat => {
      let icon = <Dice1 className="w-6 h-6 text-amber-400" />;
      if (cat.id === 'favorites') icon = <Heart className="w-6 h-6 text-red-400 fill-red-400" />;
      else if (cat.id === 'trending') icon = <TrendingUp className="w-6 h-6 text-amber-400" />;
      else if (cat.id === 'new-releases') icon = <Sparkles className="w-6 h-6 text-amber-300" />;
      else if (cat.id === 'recent') icon = <Zap className="w-6 h-6 text-amber-400" />;
      else if (cat.id === 'quick' || cat.id === 'short') icon = <Clock className="w-6 h-6 text-emerald-400" />;
      else if (cat.id === 'strategy') icon = <Brain className="w-6 h-6 text-amber-300" />;
      else if (cat.id === 'party' || cat.id === 'two-player') icon = <Users className="w-6 h-6 text-rose-400" />;
      else if (cat.id === 'heavy') icon = <Sword className="w-6 h-6 text-amber-500" />;
      return { ...cat, icon };
    });
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

  const handleResetLibrary = () => {
    resetLibrary();
    setShowResetConfirm(false);
  };

  const handleEnrichDescriptions = async () => {
    setIsEnrichingDescriptions(true);
    setEnrichmentStatus('Checking games...');

    try {
      const gamesNeedingEnrichment = getGamesNeedingEnrichment();

      if (gamesNeedingEnrichment.length === 0) {
        setEnrichmentStatus('All games have descriptions.');
        setTimeout(() => setEnrichmentStatus(null), 3000);
        return;
      }

      setEnrichmentStatus(`Enriching ${gamesNeedingEnrichment.length} games...`);
      const result = await enrichLibrary();
      setEnrichmentStatus(result.success ? `Updated ${result.enriched} descriptions.` : 'Some games could not be enriched.');
      setTimeout(() => setEnrichmentStatus(null), 5000);
    } catch (error) {
      console.error('Enrichment error:', error);
      setEnrichmentStatus('Error enriching games.');
      setTimeout(() => setEnrichmentStatus(null), 5000);
    } finally {
      setIsEnrichingDescriptions(false);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
            Thy Library
          </h1>
          <p className="text-amber-200/70 text-sm font-serif italic">
            {games.length} {games.length === 1 ? 'tome' : 'tomes'} in thy collection
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {games.length > 0 && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-stone-900/70 hover:bg-stone-800 text-amber-100 rounded-lg transition-colors border border-amber-900/50 text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-stone-900/70 hover:bg-stone-800 text-amber-100 rounded-lg transition-colors border border-amber-900/50 text-sm"
              >
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            </>
          )}
          {isAddingGame && (
            <div className="flex items-center gap-2 text-amber-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding…
            </div>
          )}
          <button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-100 rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
          </button>
        </div>
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
                icon={category.icon}
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
                icon={category.icon}
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

      {/* Library Tools — collapsible footer */}
      <section className="border-t border-amber-900/30 pt-4 mt-8">
        <button
          onClick={() => setShowTools((s) => !s)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-stone-900/60 hover:bg-stone-900/80 border border-amber-900/40 rounded-lg text-amber-200/80 text-sm font-serif transition-colors"
        >
          <span className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Library Tools
          </span>
          {showTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTools && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between gap-3 p-4 bg-stone-900/60 rounded-lg border border-amber-900/40">
              <div className="min-w-0">
                <p className="text-amber-100 text-sm font-serif font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Update game descriptions
                </p>
                <p className="text-stone-400 text-xs mt-1 italic">
                  Fetch full descriptions from BoardGameGeek.
                </p>
                {enrichmentStatus && (
                  <p className="text-amber-300 text-xs mt-2">{enrichmentStatus}</p>
                )}
              </div>
              <button
                onClick={handleEnrichDescriptions}
                disabled={isEnrichingDescriptions || games.length === 0}
                className="shrink-0 flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-amber-900/40 text-amber-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnrichingDescriptions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isEnrichingDescriptions ? 'Enriching…' : 'Enrich'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 bg-red-950/30 rounded-lg border border-red-900/40">
              <div className="min-w-0">
                <p className="text-stone-100 text-sm font-serif font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Reset library
                </p>
                <p className="text-stone-400 text-xs mt-1 italic">
                  Clear all games from thy collection (cannot be undone).
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="shrink-0 flex items-center gap-2 px-3 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 text-red-200 rounded-lg transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-800/50 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-100">Reset library?</h3>
                <p className="text-sm text-stone-400 italic">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-stone-300 mb-6 text-sm">
              This will permanently delete all games from thy collection, including favorites and custom games.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetLibrary}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}

      <GameDetail
        game={selectedGame}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedGame ? favorites.includes(selectedGame.id) : false}
      />

      {showCustomForm && <CustomGameForm onClose={() => setShowCustomForm(false)} />}

      {showShareModal && (
        <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      )}

      {showCompareModal && (
        <CompareGamesModal isOpen={showCompareModal} games={games} onClose={() => setShowCompareModal(false)} />
      )}
    </div>
  );
}
