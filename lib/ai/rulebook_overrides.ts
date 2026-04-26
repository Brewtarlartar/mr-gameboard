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

  // ─── Stonemaier Dropbox batch (2026-04-25 via seed-stonemaier-rulebooks.js) ───
  // Some files exceed 50 MB and won't rehost to Supabase Storage on the
  // free tier (Apiary, Expeditions, Wingspan); their button falls back to
  // BGG /files. Wizard still grounds on them via Anthropic Files.

  400314: { filePath: 'game rulebooks/Rules and Other Public Files/Apiary/Apiary_Rulebook_r13.pdf', note: 'Stonemaier — Apiary' },
  168435: { filePath: 'game rulebooks/Rules and Other Public Files/Between Two Cities/B2C_Rulebook - English.pdf', note: 'Stonemaier — Between Two Cities' },
  159911: { filePath: 'game rulebooks/Rules and Other Public Files/Euphoria/EuphoriaRules_3rdEd_v3.pdf', note: 'Stonemaier — Euphoria' },
  436126: { filePath: 'game rulebooks/Rules and Other Public Files/Finspan/FS_Rulebook_r19.pdf', note: 'Stonemaier — Finspan' },
  356033: { filePath: 'game rulebooks/Rules and Other Public Files/Libertalia: Winds of Galecrest/Lib_Rulebook_r9.pdf', note: 'Stonemaier — Libertalia: Winds of Galecrest' },
  226320: { filePath: 'game rulebooks/Rules and Other Public Files/My Little Scythe/MLS_Rulebook_r9 (1).pdf', note: 'Stonemaier — My Little Scythe' },
  454909: { filePath: 'game rulebooks/Rules and Other Public Files/Origin Story/Origin_Rulebook_r9.pdf', note: 'Stonemaier — Origin Story' },
  426796: { filePath: 'game rulebooks/Rules and Other Public Files/Stamp Swap/SS_Rulebook_r13.pdf', note: 'Stonemaier — Stamp Swap' },
  286096: { filePath: 'game rulebooks/Rules and Other Public Files/Tapestry/TapestryRules_r17.pdf', note: 'Stonemaier — Tapestry' },
  123540: { filePath: 'game rulebooks/Rules and Other Public Files/Tokaido/Tokaido_Rulebook_r10.pdf', note: 'Funforge / Stonemaier-distributed — Tokaido' },
  363183: { filePath: 'game rulebooks/Rules and Other Public Files/Tokaido Duo/TokaDuo_Rules_r5.pdf', note: 'Funforge — Tokaido Duo' },
  420033: { filePath: 'game rulebooks/Rules and Other Public Files/Vantage/Vantage_Rulebook_r26_web.pdf', note: 'Stonemaier — Vantage' },
  128621: { filePath: 'game rulebooks/Rules and Other Public Files/Viticulture/VitiRulebook_EssEd_2nd_r15_web.pdf', note: 'Stonemaier — Viticulture (Essential Edition)' },
  410201: { filePath: 'game rulebooks/Rules and Other Public Files/Wyrmspan/Wyr_Rulebook_r19.pdf', note: 'Stonemaier — Wyrmspan' },

  // ─── Disabled (Anthropic returns "Could not process PDF" 400) ───
  // These Stonemaier print-quality PDFs (image-heavy, very large) trip
  // Anthropic's PDF processing. Wizard answers will use training
  // knowledge for these games until we either compress the PDFs or
  // implement chat-route fallback. The rulebook button still works
  // (BGG /files fallback).
  // 266192: Wingspan (75.9 MB)
  // 379078: Expeditions (90.6 MB)
  // 312804: Pendulum (46.1 MB)
  // 329465: Red Rising (25.1 MB — surprisingly fails despite being smaller)
};

export function getRulebookOverride(bggId: number): RulebookOverride | null {
  return RULEBOOK_OVERRIDES[bggId] ?? null;
}
