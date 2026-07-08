'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDialogA11y } from '@/lib/hooks/useDialogA11y';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** id of the heading element inside the dialog (wired to aria-labelledby). */
  labelledBy: string;
  children: ReactNode;
  /** Extra classes for the panel (e.g. max-w-5xl). */
  className?: string;
}

/**
 * The canonical Tavern modal shell: portal + dimmed backdrop + stone panel,
 * with full dialog accessibility (focus trap, Escape, focus restore, scroll
 * lock) via useDialogA11y. New modals should use this instead of hand-rolling
 * the overlay; the four legacy modals use the hook directly.
 */
export default function Dialog({ isOpen, onClose, labelledBy, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDialogA11y(panelRef, { isOpen, onClose });

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'bg-gradient-to-b from-surface-raised to-surface border border-edge/60 rounded-2xl',
              'shadow-tavern-3 w-full max-w-2xl my-4 flex flex-col',
              className,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
