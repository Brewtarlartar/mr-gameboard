'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface CustomGameFormProps {
  onClose: () => void;
}

export default function CustomGameForm({ onClose }: CustomGameFormProps) {
  const [formData, setFormData] = useState<Partial<Game>>({
    name: '',
    description: '',
    minPlayers: undefined,
    maxPlayers: undefined,
    playingTime: undefined,
    complexity: undefined,
  });
  const { addCustomGame } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const customGame: Game = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      minPlayers: formData.minPlayers,
      maxPlayers: formData.maxPlayers,
      playingTime: formData.playingTime,
      complexity: formData.complexity,
      isCustom: true,
    };

    addCustomGame(customGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-purple-600">Add Custom Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Game Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Min Players
              </label>
              <input
                type="number"
                value={formData.minPlayers || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minPlayers: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Max Players
              </label>
              <input
                type="number"
                value={formData.maxPlayers || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxPlayers: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Playing Time (minutes)
              </label>
              <input
                type="number"
                value={formData.playingTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    playingTime: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                style={{ colorScheme: 'light' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Complexity (1-5)
              </label>
              <input
                type="number"
                value={formData.complexity || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    complexity: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                max="5"
                step="0.1"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
