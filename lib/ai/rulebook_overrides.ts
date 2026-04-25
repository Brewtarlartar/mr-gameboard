/**
 * Manual overrides for rulebook PDF URLs, keyed by BGG ID.
 *
 * The bulk sync's BGG /files endpoint sometimes returns HTML files-listing
 * pages instead of direct PDFs. For games we know the user plays, a curated
 * publisher-hosted PDF is more reliable. The upload pipeline tries this map
 * first, then falls back to bgg_games_cache.rulebook_url.
 *
 * Add entries as the user provides them. Keep notes for future maintenance
 * (publishers move URLs).
 */

export interface RulebookOverride {
  url: string;
  note?: string;
}

export const RULEBOOK_OVERRIDES: Record<number, RulebookOverride> = {
  // Format:
  // 162886: { url: 'https://example.com/spirit-island-rulebook.pdf', note: 'Spirit Island' },
};

export function getRulebookOverride(bggId: number): RulebookOverride | null {
  return RULEBOOK_OVERRIDES[bggId] ?? null;
}
