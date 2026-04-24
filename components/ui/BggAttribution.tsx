import Link from 'next/link';

type Size = 'sm' | 'md';

// BGG's commercial-license terms require visible "Powered by BGG" attribution.
// Drop a logo image at /public/bgg-logo.png to upgrade the text-only fallback.
export default function BggAttribution({
  size = 'sm',
  className = '',
}: {
  size?: Size;
  className?: string;
}) {
  const textSize = size === 'md' ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs';
  return (
    <Link
      href="https://boardgamegeek.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-200 transition-colors font-serif italic ${textSize} ${className}`}
    >
      <span aria-hidden="true">🎲</span>
      <span>
        Powered by <span className="not-italic font-semibold">BoardGameGeek</span>
      </span>
    </Link>
  );
}
