'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TurnTimer() {
  const [seconds, setSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(300);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    setSeconds(initialTime);
  };

  const setTime = (minutes: number) => {
    const newTime = minutes * 60;
    setInitialTime(newTime);
    setSeconds(newTime);
    setIsRunning(false);
  };

  const isTimeUp = seconds === 0 && !isRunning;
  const isWarning = seconds > 0 && seconds < 60;
  const progress = initialTime > 0 ? (seconds / initialTime) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Time Presets */}
      <div>
        <div className="text-[10px] text-amber-200/60 mb-2 font-serif uppercase tracking-wider">
          Quick Set
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 5, 10, 15].map((mins) => {
            const active = initialTime === mins * 60;
            return (
              <button
                key={mins}
                onClick={() => setTime(mins)}
                className={`px-2.5 py-1 border rounded-md text-xs font-serif font-semibold transition-colors ${
                  active
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                    : 'bg-stone-900/60 border-amber-900/40 text-amber-100/80 hover:border-amber-700/60 hover:text-amber-200'
                }`}
              >
                {mins}m
              </button>
            );
          })}
        </div>
      </div>

      {/* Timer Display */}
      <motion.div
        animate={isTimeUp ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className={`relative p-6 rounded-2xl border-2 text-center transition-colors overflow-hidden ${
          isTimeUp
            ? 'bg-red-950/40 border-red-500/60'
            : isWarning
            ? 'bg-amber-900/30 border-amber-500/60'
            : 'bg-stone-950/70 border-amber-900/50'
        }`}
      >
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            background: isTimeUp
              ? '#ef4444'
              : isWarning
              ? '#f59e0b'
              : 'linear-gradient(90deg, #b45309, #f59e0b)',
          }}
        />

        <Clock
          className={`w-7 h-7 mx-auto mb-2 ${
            isTimeUp
              ? 'text-red-400'
              : isWarning
              ? 'text-amber-300'
              : 'text-amber-400'
          }`}
        />
        <div
          className={`text-5xl font-serif font-bold tracking-tight tabular-nums ${
            isTimeUp
              ? 'text-red-300'
              : isWarning
              ? 'text-amber-200'
              : 'text-amber-100'
          }`}
        >
          {formatTime(seconds)}
        </div>
        {isTimeUp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center justify-center gap-2 text-red-400 font-serif font-semibold text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Time&apos;s Up!
          </motion.div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-serif font-semibold text-sm transition-colors border shadow-md ${
            isRunning
              ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 border-red-400/40 text-stone-50 shadow-red-900/30'
              : 'bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-amber-400/40 text-stone-950 shadow-amber-900/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 rounded-lg flex items-center gap-2 font-serif text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Custom Time Input */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-amber-200/60 font-serif">Custom:</span>
        <input
          type="number"
          min="1"
          max="60"
          value={Math.floor(initialTime / 60)}
          onChange={(e) => {
            const mins = parseInt(e.target.value) || 1;
            setTime(Math.min(60, Math.max(1, mins)));
          }}
          className="w-16 px-2.5 py-1.5 bg-stone-950/70 border border-amber-900/50 rounded-md text-amber-100 text-center font-serif font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-amber-200/80 font-serif">minutes</span>
      </div>
    </div>
  );
}
