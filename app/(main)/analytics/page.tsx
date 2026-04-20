'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import InsightsDashboard from '@/components/analytics/InsightsDashboard';
import PlayHistory from '@/components/analytics/PlayHistory';
import LogSessionModal from '@/components/analytics/LogSessionModal';

export default function AnalyticsPage() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');

  return (
    <div className="space-y-6 pt-28 md:pt-32 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 leading-tight">
          The Chronicle
        </h1>
        <p className="text-amber-200/70 text-sm font-serif italic">
          Every battle, every victory — scribed for posterity.
        </p>
      </motion.div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Chronicle views"
          className="bg-gradient-to-b from-stone-900/80 to-stone-950/80 border border-amber-900/50 rounded-xl p-1 flex gap-1 w-full sm:w-auto shadow-inner shadow-black/30"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'insights'}
            onClick={() => setActiveTab('insights')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg font-serif text-sm font-semibold transition-all ${
              activeTab === 'insights'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-900/40'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights
            </div>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg font-serif text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-900/40'
                : 'text-amber-200/70 hover:text-amber-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </div>
          </button>
        </div>

        {/* Log Session Button */}
        <button
          onClick={() => setShowLogModal(true)}
          title="Scribe a game session into the chronicle"
          aria-label="Log a new game session"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-semibold rounded-xl transition-colors shadow-lg shadow-amber-900/30 border border-amber-400/40 text-sm"
        >
          <Image
            src="/tome-book.png"
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 object-contain drop-shadow-[0_0_3px_rgba(0,0,0,0.45)]"
          />
          <span>Scribe a Session</span>
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
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
