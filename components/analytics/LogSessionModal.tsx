'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Save, Calendar, Clock, Users, Star, Trophy } from 'lucide-react';
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';
import { useGameStore } from '@/lib/store/gameStore';
import { Game } from '@/types/game';

interface LogSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedGame?: Game;
}

export default function LogSessionModal({ isOpen, onClose, preselectedGame }: LogSessionModalProps) {
  const { games } = useGameStore();
  const { addSession } = usePlayHistoryStore();

  const [selectedGame, setSelectedGame] = useState<Game | null>(preselectedGame || null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(60);
  const [players, setPlayers] = useState<Array<{ name: string; score?: number; isWinner: boolean }>>([
    { name: '', score: undefined, isWinner: false },
  ]);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);

  const handleSubmit = () => {
    if (!selectedGame || players.some(p => !p.name.trim())) {
      alert('Please fill in all required fields');
      return;
    }

    addSession({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      date: new Date(date),
      duration,
      players: players.filter(p => p.name.trim()),
      notes: notes.trim() || undefined,
      rating,
    });

    onClose();
    // Reset form
    setSelectedGame(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDuration(60);
    setPlayers([{ name: '', score: undefined, isWinner: false }]);
    setNotes('');
    setRating(undefined);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', score: undefined, isWinner: false }]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: string, value: any) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
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
          <h2 className="text-2xl font-black text-purple-600">Log Play Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Game *
            </label>
            <select
              value={selectedGame?.id || ''}
              onChange={(e) => {
                const game = games.find(g => g.id === e.target.value);
                setSelectedGame(game || null);
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              required
            >
              <option value="">Select a game...</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration (min) *
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                required
              />
            </div>
          </div>

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                <Users className="w-4 h-4 inline mr-1" />
                Players *
              </label>
              <button
                onClick={addPlayer}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Player
              </button>
            </div>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Player name"
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={player.score || ''}
                    onChange={(e) => updatePlayer(index, 'score', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                  />
                  <button
                    onClick={() => updatePlayer(index, 'isWinner', !player.isWinner)}
                    className={`p-2 rounded-lg transition-all ${
                      player.isWinner
                        ? 'bg-amber-50 border border-amber-300'
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                    title="Winner"
                  >
                    <Trophy className={`w-4 h-4 ${player.isWinner ? 'text-amber-500' : 'text-gray-400'}`} />
                  </button>
                  {players.length > 1 && (
                    <button
                      onClick={() => removePlayer(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(rating === star ? undefined : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating && star <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any memorable moments or thoughts about the game..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none min-h-[100px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Session
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
