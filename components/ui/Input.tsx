'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full rounded-xl px-4 py-2.5 text-sm bg-surface-raised/80 border border-edge/60 text-ink placeholder:text-ink-muted/40 transition-colors focus:outline-none focus:border-gold/70 focus:ring-1 focus:ring-gold/40 min-h-[44px]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(FIELD, 'min-h-[88px] py-3', className)} {...props} />;
});
