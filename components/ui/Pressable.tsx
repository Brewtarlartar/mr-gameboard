'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * A keyboard-accessible tap surface: a real <button> with the chrome
 * stripped, so any region can be made pressable without the div+onClick
 * pattern (which keyboards and screen readers can't operate).
 *
 * For cards that contain their own action buttons, render Pressable as an
 * absolutely-positioned overlay that is a SIBLING of those actions:
 *
 *   <div className="relative">
 *     <Pressable className="absolute inset-0 z-[5]" aria-label={`Open ${name}`} onClick={open} />
 *     ...card content...
 *     <div className="absolute top-2 right-2 z-10">...action buttons...</div>
 *   </div>
 *
 * Interactive elements must never nest, so the overlay pattern keeps the
 * card body pressable while the real buttons sit above it.
 * Focus styling comes from the global :focus-visible rule.
 */
const Pressable = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function Pressable({ className, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'appearance-none bg-transparent p-0 m-0 border-0 text-left cursor-pointer',
          className,
        )}
        {...props}
      />
    );
  },
);

export default Pressable;
