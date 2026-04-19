'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface TomeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  /**
   * If true (default), the logo is wrapped in a Link back to the home page.
   * Set to false in contexts where the logo should not be interactive
   * (for example, when it's embedded inside another anchor).
   */
  asLink?: boolean;
}

export default function TomeLogo({
  size = 'md',
  showText = true,
  animated = true,
  asLink = true,
}: TomeLogoProps) {
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-base' },
    md: { icon: 'w-10 h-10', text: 'text-2xl' },
    lg: { icon: 'w-20 h-20', text: 'text-4xl' },
  };

  const IconWrapper = animated ? motion.div : 'div';

  const content = (
    <div className="flex items-center gap-2">
      <IconWrapper
        className={`${sizes[size].icon} relative flex-shrink-0`}
        {...(animated && {
          initial: { rotate: 0 },
          animate: { rotate: [0, 3, -3, 0] },
          transition: { duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' as const },
        })}
      >
        <Image
          src="/tome-book.png"
          alt="The Tome"
          fill
          sizes="80px"
          priority
          className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
        />
      </IconWrapper>

      {showText && (
        <span className={`${sizes[size].text} font-display font-extrabold gradient-text`}>
          The Tome
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        aria-label="The Tome — home"
        className="inline-flex items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 hover:opacity-95 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
