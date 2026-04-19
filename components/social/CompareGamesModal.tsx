'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, TrendingUp, Star, Clock, Target, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';
import { Game } from '@/types/game';

interface CompareGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
}

interface GameAnalysis {
  gameId: string;
  pros: string[];
  cons: string[];
  isLoading: boolean;
}

export default function CompareGamesModal({ isOpen, onClose, games: allGames }: CompareGamesModalProps) {
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [gameAnalyses, setGameAnalyses] = useState<Map<string, GameAnalysis>>(new Map());

  const toggleGame = (game: Game) => {
    if (selectedGames.find(g => g.id === game.id)) {
      setSelectedGames(selectedGames.filter(g => g.id !== game.id));
      // Remove analysis for removed game
      const newAnalyses = new Map(gameAnalyses);
      newAnalyses.delete(game.id);
      setGameAnalyses(newAnalyses);
    } else if (selectedGames.length < 6) {
      setSelectedGames([...selectedGames, game]);
      // Start loading analysis for new game
      generateGameAnalysis(game);
    }
  };

  const generateGameAnalysis = async (game: Game) => {
    // Set loading state
    setGameAnalyses(prev => new Map(prev).set(game.id, {
      gameId: game.id,
      pros: [],
      cons: [],
      isLoading: true
    }));

    try {
      const userPrompt = `For a game night, give me exactly 3 pros and 3 cons for playing "${game.name}".
Consider: player count (${game.minPlayers}-${game.maxPlayers}), playtime (${game.playingTime || 'unknown'} min), complexity (${game.complexity || 'unknown'}/5), and mechanics (${game.mechanics?.join(', ') || 'various'}).
Format your response as:
PROS:
- [pro 1]
- [pro 2]
- [pro 3]

CONS:
- [con 1]
- [con 2]
- [con 3]`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to generate analysis');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }
      const analysis = parseProsCons(accumulated);

      setGameAnalyses(prev => new Map(prev).set(game.id, {
        gameId: game.id,
        pros: analysis.pros,
        cons: analysis.cons,
        isLoading: false
      }));
    } catch (error) {
      console.error('[Game Analysis] Error:', error);
      // Set fallback analysis
      setGameAnalyses(prev => new Map(prev).set(game.id, {
        gameId: game.id,
        pros: ['Great gameplay', 'Popular choice', 'Well-designed'],
        cons: ['Analysis unavailable', 'Try again later', 'AI error'],
        isLoading: false
      }));
    }
  };

  const parseProsCons = (text: string): { pros: string[], cons: string[] } => {
    const pros: string[] = [];
    const cons: string[] = [];
    
    const lines = text.split('\n');
    let currentSection: 'pros' | 'cons' | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toUpperCase().includes('PROS:')) {
        currentSection = 'pros';
      } else if (trimmed.toUpperCase().includes('CONS:')) {
        currentSection = 'cons';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const item = trimmed.substring(1).trim();
        if (item && currentSection === 'pros' && pros.length < 3) {
          pros.push(item);
        } else if (item && currentSection === 'cons' && cons.length < 3) {
          cons.push(item);
        }
      }
    }
    
    // Fallback if parsing fails
    if (pros.length === 0) pros.push('Great game mechanics', 'Popular choice', 'Engaging gameplay');
    if (cons.length === 0) cons.push('May require setup time', 'Learning curve', 'Storage space needed');
    
    return { pros, cons };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-purple-600">Compare Games</h2>
            <p className="text-gray-500 text-sm mt-1">Select up to 6 games to compare side-by-side</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Game Selection */}
        {selectedGames.length < 6 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Games</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => toggleGame(game)}
                  disabled={selectedGames.length >= 6 && !selectedGames.find(g => g.id === game.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedGames.find(g => g.id === game.id)
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-sm font-semibold text-gray-900 line-clamp-1">{game.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {game.minPlayers}-{game.maxPlayers} players
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {selectedGames.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 sticky left-0 bg-white z-10">
                    Property
                  </th>
                  {selectedGames.map((game) => (
                    <th key={game.id} className="py-4 px-3 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                          {game.image ? (
                            <img
                              src={game.image}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🎲
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900 line-clamp-2 max-w-[160px] text-center">
                          {game.name}
                        </div>
                        <button
                          onClick={() => toggleGame(game)}
                          className="text-xs text-red-500 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Year Published */}
                <ComparisonRow
                  label="Year"
                  icon={TrendingUp}
                  values={selectedGames.map(g => g.yearPublished?.toString() || 'N/A')}
                />

                {/* Players */}
                <ComparisonRow
                  label="Players"
                  icon={Users}
                  values={selectedGames.map(g => `${g.minPlayers}-${g.maxPlayers}`)}
                />

                {/* Play Time */}
                <ComparisonRow
                  label="Play Time"
                  icon={Clock}
                  values={selectedGames.map(g => g.playingTime ? `${g.playingTime} min` : 'N/A')}
                />

                {/* Complexity */}
                <ComparisonRow
                  label="Complexity"
                  icon={Target}
                  values={selectedGames.map(g => 
                    g.complexity ? `${g.complexity.toFixed(1)}/5` : 'N/A'
                  )}
                />

                {/* Rating */}
                <ComparisonRow
                  label="BGG Rating"
                  icon={Star}
                  values={selectedGames.map(g => 
                    g.rating ? `${g.rating.toFixed(1)}/10` : 'N/A'
                  )}
                />

                {/* Genres */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-sm text-gray-500 sticky left-0 bg-white">Genres</td>
                  {selectedGames.map((game) => (
                    <td key={game.id} className="py-4 px-3 text-center align-top">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {game.genres?.slice(0, 3).map((genre, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Mechanics */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4 text-sm text-gray-500 sticky left-0 bg-white">Mechanics</td>
                  {selectedGames.map((game) => (
                    <td key={game.id} className="py-4 px-3 text-center align-top">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {game.mechanics?.slice(0, 3).map((mechanic, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-teal-50 text-teal-600 text-xs rounded-full"
                          >
                            {mechanic}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* AI-Generated Pros */}
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="py-4 px-4 align-top sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-500 font-semibold">Pros</span>
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                  </td>
                  {selectedGames.map((game) => {
                    const analysis = gameAnalyses.get(game.id);
                    return (
                      <td key={game.id} className="py-4 px-3 align-top">
                        {analysis?.isLoading ? (
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        ) : (
                          <ul className="text-left space-y-2">
                            {analysis?.pros.map((pro, i) => (
                              <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* AI-Generated Cons */}
                <tr className="border-b border-gray-200 bg-red-50">
                  <td className="py-4 px-4 align-top sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-500 font-semibold">Cons</span>
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                  </td>
                  {selectedGames.map((game) => {
                    const analysis = gameAnalyses.get(game.id);
                    return (
                      <td key={game.id} className="py-4 px-3 align-top">
                        {analysis?.isLoading ? (
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        ) : (
                          <ul className="text-left space-y-2">
                            {analysis?.cons.map((con, i) => (
                              <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">✗</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Description */}
                <tr>
                  <td className="py-4 px-4 text-sm text-gray-500 align-top sticky left-0 bg-white">Description</td>
                  {selectedGames.map((game) => (
                    <td key={game.id} className="py-4 px-3 align-top">
                      <p className="text-xs text-gray-700 line-clamp-4 text-left">
                        {game.description || 'No description available'}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedGames.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select games above to start comparing</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ComparisonRow({
  label,
  icon: Icon,
  values,
}: {
  label: string;
  icon: React.ComponentType<any>;
  values: string[];
}) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-4 px-4 sticky left-0 bg-white">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">{label}</span>
        </div>
      </td>
      {values.map((value, index) => (
        <td key={index} className="py-4 px-3 text-center">
          <span className="text-sm font-semibold text-gray-900">{value}</span>
        </td>
      ))}
    </tr>
  );
}
