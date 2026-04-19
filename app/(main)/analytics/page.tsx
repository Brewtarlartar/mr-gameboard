'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, Trophy } from 'lucide-react';
import InsightsDashboard from '@/components/analytics/InsightsDashboard';
import PlayHistory from '@/components/analytics/PlayHistory';
import LogSessionModal from '@/components/analytics/LogSessionModal';

export default function AnalyticsPage() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-10 h-10 text-purple-500" />
          <h1 className="text-5xl font-black text-gray-900 font-bold">
            Game Analytics
          </h1>
        </div>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Track your gaming habits, analyze performance, and discover insights
        </p>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-1 flex gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </div>
          </button>
        </div>

        {/* Log Session Button */}
        <button
          onClick={() => setShowLogModal(true)}
          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          Log Game Session
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {activeTab === 'insights' ? <InsightsDashboard /> : <PlayHistory />}
      </motion.div>

      {/* Log Session Modal */}
      {showLogModal && (
        <LogSessionModal isOpen={showLogModal} onClose={() => setShowLogModal(false)} />
      )}
    </div>
  );
}
