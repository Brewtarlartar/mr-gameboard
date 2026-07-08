import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the signature gold-glow hover treatment for cards inside links/Pressables. */
  interactive?: boolean;
}

/**
 * The Tavern card surface: stone gradient, amber edge, xl radius.
 * Purely presentational — for a clickable card, place a Pressable overlay
 * inside (see Pressable docs) rather than adding onClick here.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-gradient-to-b from-surface/90 via-surface-raised/80 to-surface/95',
        'border border-edge/50 rounded-xl overflow-hidden',
        interactive &&
          'transition-all hover:border-gold/60 hover:shadow-gold-glow',
        className,
      )}
      {...props}
    />
  );
});

export default Card;
