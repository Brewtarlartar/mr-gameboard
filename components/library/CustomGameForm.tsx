'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface CustomGameFormProps {
  onClose: () => void;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 600;
const JPEG_QUALITY = 0.85;

async function compressImageFile(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode image'));
    el.src = dataUrl;
  });

  const longest = Math.max(img.width, img.height);
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  if (scale === 1 && file.type === 'image/jpeg') {
    return dataUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

const inputClass =
  'w-full px-3 py-2 bg-stone-950/70 border border-amber-900/50 text-amber-100 placeholder-stone-500 rounded-lg font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 transition-colors';

const numberInputClass =
  'w-full px-3 py-2 bg-stone-950/70 border border-amber-900/50 text-amber-100 placeholder-stone-500 rounded-lg font-serif text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const labelClass =
  'block text-xs sm:text-sm font-serif font-semibold text-amber-200/90 mb-1.5 tracking-wide uppercase';

export default function CustomGameForm({ onClose }: CustomGameFormProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<Partial<Game>>({
    name: '',
    description: '',
    minPlayers: undefined,
    maxPlayers: undefined,
    playingTime: undefined,
    complexity: undefined,
  });
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [isProcessingThumb, setIsProcessingThumb] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCustomGame } = useGameStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailError(null);

    if (!file.type.startsWith('image/')) {
      setThumbnailError('Please choose an image file.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setThumbnailError('Image is too large (max 8 MB).');
      e.target.value = '';
      return;
    }

    setIsProcessingThumb(true);
    try {
      const compressed = await compressImageFile(file);
      setThumbnail(compressed);
    } catch {
      setThumbnailError('Could not read that image. Try another file.');
    } finally {
      setIsProcessingThumb(false);
      e.target.value = '';
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const customGame: Game = {
      id: `custom-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description,
      minPlayers: formData.minPlayers,
      maxPlayers: formData.maxPlayers,
      playingTime: formData.playingTime,
      complexity: formData.complexity,
      isCustom: true,
      ...(thumbnail ? { image: thumbnail, thumbnail } : {}),
    };

    addCustomGame(customGame);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-game-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-900/50 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[95vh]"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-stone-950/95 backdrop-blur-sm border-b border-amber-900/40 rounded-t-2xl">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center overflow-hidden">
              <Image
                src="/tome-book.png"
                alt=""
                width={28}
                height={28}
                className="object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              />
            </div>
            <div className="min-w-0">
              <h2
                id="custom-game-title"
                className="text-xl sm:text-2xl font-serif font-bold text-amber-100"
              >
                Inscribe a New Tome
              </h2>
              <p className="text-amber-200/60 text-[11px] sm:text-sm font-serif italic whitespace-nowrap overflow-hidden">
                Add a game to thy library by hand
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
            className="flex items-center gap-2 px-3 py-2 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg text-sm font-serif transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5"
        >
          <div>
            <span className={labelClass}>Thumbnail</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {thumbnail ? (
              <div className="flex items-start gap-3">
                <div className="relative w-28 h-36 sm:w-32 sm:h-40 shrink-0 rounded-lg overflow-hidden border border-amber-900/50 bg-stone-950 shadow-md shadow-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnail}
                    alt="Selected thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleFilePick}
                    disabled={isProcessingThumb}
                    className="flex items-center gap-2 px-3 py-1.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif text-xs sm:text-sm transition-colors disabled:opacity-60"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="flex items-center gap-2 px-3 py-1.5 bg-stone-800/70 hover:bg-red-900/40 border border-amber-900/40 hover:border-red-700/50 text-amber-100 hover:text-red-200 rounded-lg font-serif text-xs sm:text-sm transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFilePick}
                disabled={isProcessingThumb}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-stone-950/60 hover:bg-stone-900/70 border border-dashed border-amber-900/60 hover:border-amber-500/60 text-amber-200/80 hover:text-amber-100 rounded-lg font-serif transition-colors disabled:opacity-60"
              >
                <ImagePlus className="w-6 h-6 text-amber-400/80" />
                <span className="text-sm font-semibold">
                  {isProcessingThumb ? 'Processing…' : 'Add Thumbnail'}
                </span>
                <span className="text-[11px] text-amber-200/50 italic">
                  PNG, JPG, or WEBP — up to 8 MB
                </span>
              </button>
            )}
            {thumbnailError && (
              <p className="mt-2 text-xs text-red-300 font-serif italic">
                {thumbnailError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="custom-name" className={labelClass}>
              Game Name <span className="text-amber-400">*</span>
            </label>
            <input
              id="custom-name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Gloomhaven"
              className={inputClass}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="custom-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="custom-description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="A brief tale of what this game is about…"
              className={`${inputClass} resize-y min-h-[88px]`}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="custom-min" className={labelClass}>
                Min Players
              </label>
              <input
                id="custom-min"
                type="number"
                value={formData.minPlayers ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPlayers: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className={numberInputClass}
                min="1"
                placeholder="—"
              />
            </div>
            <div>
              <label htmlFor="custom-max" className={labelClass}>
                Max Players
              </label>
              <input
                id="custom-max"
                type="number"
                value={formData.maxPlayers ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPlayers: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className={numberInputClass}
                min="1"
                placeholder="—"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="custom-time" className={labelClass}>
                Playing Time (min)
              </label>
              <input
                id="custom-time"
                type="number"
                value={formData.playingTime ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    playingTime: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className={numberInputClass}
                min="1"
                placeholder="—"
              />
            </div>
            <div>
              <label htmlFor="custom-complexity" className={labelClass}>
                Complexity (1–5)
              </label>
              <input
                id="custom-complexity"
                type="number"
                value={formData.complexity ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    complexity: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className={numberInputClass}
                min="1"
                max="5"
                step="0.1"
                placeholder="—"
              />
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-stone-950/95 backdrop-blur-sm border-t border-amber-900/40 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg font-serif text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!formData.name?.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:from-stone-700 disabled:to-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed border border-amber-400/40 text-stone-950 rounded-lg font-serif font-semibold text-sm shadow-md shadow-amber-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add to Library
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
