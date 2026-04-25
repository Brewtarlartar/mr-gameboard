/**
 * Manual overrides for rulebook PDF sources, keyed by BGG ID.
 *
 * Each entry is either:
 *   - { url: 'https://…/rulebook.pdf' }  — direct PDF on the public web
 *   - { filePath: 'game rulebooks/…/Foo.pdf' }  — local file (used for
 *     publishers like Stonemaier who only distribute via Dropbox folders).
 *     Path is relative to the project root, or absolute. Pre-warm runs
 *     locally, so the file only has to exist on the dev machine.
 *
 * The upload pipeline tries this map first, then falls back to
 * bgg_games_cache.rulebook_url for games not listed here.
 */

export interface RulebookOverride {
  url?: string;
  filePath?: string;
  note?: string;
}

export const RULEBOOK_OVERRIDES: Record<number, RulebookOverride> = {
  // Terraforming Mars
  167791: {
    url: 'https://fryxgames.se/wp-content/uploads/2023/04/TMRULESFINAL.pdf',
    note: 'FryxGames official rulebook',
  },
  // Dune: Imperium
  316554: {
    url: 'https://d19y2ttatozxjp.cloudfront.net/pdfs/DUNE_IMPERIUM_Rules_2020_10_26.pdf',
    note: 'Dire Wolf Digital official rulebook',
  },
  // Dune: Imperium – Uprising
  397598: {
    url: 'https://d19y2ttatozxjp.cloudfront.net/pdfs/DUNE_IMPERIUM_UPRISING_Main_Rulebook_23-10-12.pdf',
    note: 'Dire Wolf Digital — standalone Uprising rulebook',
  },
  // Cosmic Encounter (FFG, 2008)
  39463: {
    url: 'https://images-cdn.fantasyflightgames.com/filer_public/a8/bf/a8bfc766-193c-4f40-a4ea-9864b8ae7953/ce01_rulebook_web.pdf',
    note: 'Fantasy Flight Games web rulebook',
  },
  // Scythe — Stonemaier ships only via Dropbox folder, so we use a local
  // copy for upload. This is the Complete Rulebook covering all expansions.
  169786: {
    filePath: 'game rulebooks/Rules and Other Public Files/Scythe/Complete Rulebook/ScytheRulesCombined_V2_CS_r13-BW.pdf',
    note: 'Stonemaier Complete Rulebook (BW, all expansions)',
  },
};

export function getRulebookOverride(bggId: number): RulebookOverride | null {
  return RULEBOOK_OVERRIDES[bggId] ?? null;
}
