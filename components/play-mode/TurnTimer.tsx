'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TurnTimer() {
  const [seconds, setSeconds] = useState(300); // Default 5 minutes
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
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="space-y-5">
      {/* Time Presets */}
      <div>
        <div className="text-sm text-gray-500 mb-3 font-ui">Quick Set:</div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 5, 10, 15].map((mins) => (
            <button
              key={mins}
              onClick={() => setTime(mins)}
              className={`px-3 py-1.5 border rounded-lg text-sm font-ui font-medium transition-all hover:scale-105 active:scale-95 ${
                initialTime === mins * 60
                  ? 'bg-purple-50 border-purple-500 text-purple-600'
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-gray-900'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Timer Display */}
      <motion.div
        animate={isTimeUp ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className={`relative p-8 rounded-2xl border-4 text-center transition-all overflow-hidden ${
          isTimeUp
            ? 'bg-red-50 border-red-400 shadow-lg shadow-red-100'
            : isWarning
            ? 'bg-amber-50 border-amber-400 shadow-lg shadow-amber-100'
            : 'bg-white border-purple-200 shadow-lg shadow-purple-100'
        }`}
      >
        {/* Progress bar background */}
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear"
          style={{ 
            width: `${progress}%`,
            background: isTimeUp 
              ? '#ef4444' 
              : isWarning 
              ? '#eab308' 
              : 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
          }}
        />
        
        <Clock className={`w-8 h-8 mx-auto mb-3 ${
          isTimeUp ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-purple-500'
        }`} />
        <div
          className={`text-6xl font-black font-display tracking-tight ${
            isTimeUp ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-900'
          }`}
        >
          {formatTime(seconds)}
        </div>
        {isTimeUp && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-2 text-red-500 font-semibold font-ui"
          >
            <AlertTriangle className="w-5 h-5" />
            Time&apos;s Up!
          </motion.div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-ui font-semibold hover:scale-105 active:scale-95 shadow-lg ${
            isRunning
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-200'
              : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-purple-200'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start
            </>
          )}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-100 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-600 rounded-xl transition-all flex items-center gap-2 font-ui font-medium hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Custom Time Input */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-gray-500 font-ui text-sm">Custom:</span>
        <input
          type="number"
          min="1"
          max="60"
          value={Math.floor(initialTime / 60)}
          onChange={(e) => {
            const mins = parseInt(e.target.value) || 1;
            setTime(Math.min(60, Math.max(1, mins)));
          }}
          className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-center text-lg font-ui font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-gray-700 font-ui">minutes</span>
      </div>
    </div>
  );
}
