'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, Copy, Check, Twitter, Facebook, Link as LinkIcon, X } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { toPng } from 'html-to-image';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { games, favorites } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const stats = {
    total: games.length,
    favorites: favorites.length,
    avgRating: games.length > 0
      ? (games.reduce((sum, g) => sum + (g.rating || 0), 0) / games.length).toFixed(1)
      : '0',
    topGenres: getTopGenres(),
  };

  function getTopGenres() {
    const genreCounts = new Map<string, number>();
    games.forEach((game) => {
      game.genres?.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });
    return Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
  }

  const topGames = [...games]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareText = `Check out my board game collection! 🎲 ${stats.total} games, ${stats.favorites} favorites! #BoardGames #MrBoardGame`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCard = async () => {
    setGenerating(true);
    const element = document.getElementById('share-card');
    if (element) {
      try {
        const dataUrl = await toPng(element, {
          quality: 1,
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        link.download = 'my-board-game-collection.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to generate image:', error);
      }
    }
    setGenerating(false);
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-6 h-6 text-teal-500" />
            <h2 className="text-2xl font-black text-purple-600">Share Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Share Card Preview */}
        <div className="mb-6">
          <div
            id="share-card"
            className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-teal-50 rounded-xl p-8 border border-purple-200"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.3) 0%, transparent 50%)`
              }} />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-3xl font-black bg-gradient-to-r from-violet-500 via-purple-500 to-teal-500 bg-clip-text text-transparent mb-2">
                  My Board Game Collection
                </h3>
                <p className="text-gray-500">Powered by Mr. Board Game</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white/70 rounded-lg border border-gray-200">
                  <div className="text-3xl font-black text-teal-500">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Games</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg border border-gray-200">
                  <div className="text-3xl font-black text-amber-500">{stats.favorites}</div>
                  <div className="text-xs text-gray-500 mt-1">Favorites</div>
                </div>
                <div className="text-center p-4 bg-white/70 rounded-lg border border-gray-200">
                  <div className="text-3xl font-black text-purple-500">{stats.avgRating}</div>
                  <div className="text-xs text-gray-500 mt-1">Avg Rating</div>
                </div>
              </div>

              {/* Top Games */}
              {topGames.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Games</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {topGames.map((game, index) => (
                      <div
                        key={game.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                        title={game.name}
                      >
                        {game.image ? (
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎲
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 mt-6">
                🎮 Mr. Board Game • Track • Discover • Play
              </div>
            </div>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCard}
              disabled={generating}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {generating ? 'Generating...' : 'Download Card'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleShareTwitter}
              className="px-4 py-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-sm font-semibold">Twitter</span>
            </button>

            <button
              onClick={handleShareFacebook}
              className="px-4 py-3 bg-[#4267B2]/10 hover:bg-[#4267B2]/20 border border-[#4267B2]/30 text-[#4267B2] rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-sm font-semibold">Facebook</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-semibold">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Share your collection with friends and fellow gamers!
        </p>
      </motion.div>
    </div>
  );
}
