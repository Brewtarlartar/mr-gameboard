'use client';

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'gold' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-raised/80 border-edge/50 text-ink-muted/80',
  gold: 'bg-gold/15 border-gold-deep/50 text-gold-strong',
  danger: 'bg-danger/15 border-red-900/60 text-red-300',
};

const BASE =
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold border whitespace-nowrap';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Static label chip (players, playtime, mechanics, …). */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { tone = 'neutral', className, ...props },
  ref,
) {
  return <span ref={ref} className={cn(BASE, TONES[tone], className)} {...props} />;
});

export interface ToggleChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state — rendered gold and exposed to assistive tech via aria-pressed. */
  active?: boolean;
}

/** Pressable filter chip. Exposes its state via aria-pressed. */
export const ToggleChip = forwardRef<HTMLButtonElement, ToggleChipProps>(function ToggleChip(
  { active = false, type = 'button', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        BASE,
        'transition-colors cursor-pointer min-h-[32px]',
        active ? TONES.gold : cn(TONES.neutral, 'hover:border-gold/40 hover:text-ink'),
        className,
      )}
      {...props}
    />
  );
});
