'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold hover:bg-gold-strong text-surface font-serif font-semibold shadow-tavern-1 hover:shadow-gold-glow',
  secondary:
    'bg-surface-raised/80 hover:bg-surface-high border border-edge/60 hover:border-gold/50 text-ink font-serif font-semibold',
  ghost:
    'bg-transparent hover:bg-surface-high/60 text-ink-muted/80 hover:text-ink font-serif font-medium',
  danger:
    'bg-danger/90 hover:bg-danger text-ink font-serif font-semibold border border-red-900/60',
};

// md/lg meet the 44px minimum tap target; sm is for dense desktop rows only.
const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-base rounded-xl gap-2 min-h-[48px]',
};

/** The Tavern button. Use instead of hand-rolled amber/stone button classes. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center transition-colors active:scale-[0.98]',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

export default Button;
