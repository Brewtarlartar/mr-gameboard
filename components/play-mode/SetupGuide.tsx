'use client';

import { useState } from 'react';
import { Check, ChevronRight, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SetupGuideProps {
  steps: string[];
  onComplete: () => void;
}

export default function SetupGuide({ steps, onComplete }: SetupGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  const allCompleted = steps.length > 0 && completedSteps.size === steps.length;
  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold font-display text-gray-900">Setup Guide</h2>
        </div>
        {allCompleted && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onComplete}
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl transition-all flex items-center gap-2 font-ui font-semibold hover:scale-105 active:scale-95 shadow-lg shadow-green-200"
          >
            <Sparkles className="w-4 h-4" />
            Continue to Practice Round
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Progress Bar */}
      {steps.length > 0 && (
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}

      {steps.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-ui text-lg">Generating setup guide...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isActive = index === currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setCurrentStep(index)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-green-50 border-green-300'
                    : isActive
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(index);
                    }}
                    className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 hover:scale-110 active:scale-95 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1 font-ui font-medium">Step {index + 1}</div>
                    <div className={`font-ui ${isCompleted ? 'text-green-600 line-through opacity-70' : 'text-gray-900'}`}>
                      {step}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
