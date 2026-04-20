'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Clock, Star, Trash2, TrendingUp, Sparkles, Scale } from 'lucide-react';
import { Game } from '@/types/game';

const FALLBACK_IMAGES: Record<number, string> = {
  13: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__original/img/xV7oisd3RQ8R-k18cdWAYthHXsA=/0x0/filters:format(jpeg)/pic2419375.jpg',
  822: 'https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__original/img/5aNojpjdSrVg8rRvHiGpg8_Jj1g=/0x0/filters:format(jpeg)/pic1534148.jpg',
  36218: 'https://cf.geekdo-images.com/F_KDEu0GjdClml8N7c8Imw__original/img/75xcxJPIvf-HJJkXc2_W-7na6bs=/0x0/filters:format(jpeg)/pic2582929.jpg',
};

interface GameCardProps {
  game: Game & { isTrending?: boolean; isNew?: boolean; trendingRank?: number };
  onSelect: (game: Game) => void;
  onToggleFavorite: (gameId: string) => void;
  onRemove?: (gameId: string) => void;
  isFavorite: boolean;
  isOwned?: boolean;
}

export default function GameCard({
  game,
  onSelect,
  onToggleFavorite,
  onRemove,
  isFavorite,
  isOwned = true,
}: GameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const fallbackImage = game.bggId ? FALLBACK_IMAGES[game.bggId] : undefined;
  const imageUrl = imageError && fallbackImage ? fallbackImage : (game.image || game.thumbnail);
  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !(imageError && !fallbackImage);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onRemove) return;
    if (typeof window !== 'undefined') {
      const ok = window.confirm(`Remove "${game.name}" from thy library?`);
      if (!ok) return;
    }
    setIsRemoving(true);
    onRemove(game.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRemoving ? 0 : 1, y: 0, scale: isRemoving ? 0.9 : 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative h-full flex flex-col bg-gradient-to-b from-stone-950/90 via-stone-900/80 to-stone-950/95 border border-amber-900/50 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer group hover:shadow-[0_0_18px_-4px_rgba(251,191,36,0.45)] transition-all"
      onClick={() => onSelect(game)}
    >
      <div className="relative w-full aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-stone-900 to-stone-950">
        {hasValidImage ? (
          <img
            src={imageUrl}
            alt={game.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              if (!imageError && fallbackImage) {
                setImageError(true);
                (e.target as HTMLImageElement).src = fallbackImage;
              } else {
                setImageError(true);
              }
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/30 to-stone-950">
            <span className="text-5xl opacity-40">🎲</span>
          </div>
        )}

        {game.rank && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-600/90 border border-amber-400/40 rounded-md text-xs font-bold text-stone-950 z-10 shadow-md">
            <span>#{game.rank}</span>
          </div>
        )}

        {game.isTrending && (
          <div
            className="absolute left-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md text-xs font-bold text-stone-950 z-10 shadow-lg"
            style={{ top: game.rank ? '50px' : '8px' }}
          >
            <TrendingUp className="w-3 h-3" />
            <span>HOT</span>
          </div>
        )}

        {game.isNew && !game.isTrending && (
          <div
            className="absolute left-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-300 to-amber-500 rounded-md text-xs font-bold text-stone-950 z-10 shadow-lg"
            style={{ top: game.rank ? '50px' : '8px' }}
          >
            <Sparkles className="w-3 h-3" />
            <span>NEW</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          {isOwned && onRemove && (
            <button
              onClick={handleRemove}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 bg-red-950/80 hover:bg-red-800 border border-red-800/60 rounded-full transition-colors shadow-md"
              title="Remove from library"
              aria-label={`Remove ${game.name} from library`}
            >
              <Trash2 className="w-4 h-4 text-red-200" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 bg-stone-950/80 hover:bg-stone-800 border border-amber-900/40 rounded-full transition-colors shadow-md"
            title={isFavorite ? 'Unfavorite' : 'Favorite'}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-amber-200/80'
              }`}
            />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-stone-950/85 to-transparent" />
      </div>

      <div className="p-3 border-t border-amber-900/30 flex-1 flex flex-col">
        <h3
          className="font-serif font-semibold text-amber-100 mb-2 text-sm leading-snug break-words"
          style={{ minHeight: '2.75em' }}
        >
          {game.name}
        </h3>

        <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-stone-400">
          {game.minPlayers !== undefined && game.maxPlayers !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500/80" />
              <span>{game.minPlayers}-{game.maxPlayers}</span>
            </div>
          )}
          {game.playingTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500/80" />
              <span>{game.playingTime}m</span>
            </div>
          )}
          {game.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{game.rating.toFixed(1)}</span>
            </div>
          )}
          {typeof game.complexity === 'number' && game.complexity > 0 && (
            <div
              className="flex items-center gap-1"
              title={`Complexity ${game.complexity.toFixed(1)} / 5`}
            >
              <Scale className="w-3 h-3 text-amber-500/80" />
              <span>{game.complexity.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
