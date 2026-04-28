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

  // ─── Top BGG-ranked games via publisher PDFs (2026-04-26, PR 3b) ───
  // Mix of publisher-direct (preferred) and 1j1ju.com mirrors (third-party
  // aggregator, stable but not authoritative). Marked in notes.

  // Roxley Games — Brass family (1j1ju mirror; Roxley's Shopify CDN URL
  // pattern wasn't easily discoverable). Brass: Birmingham fails
  // Anthropic's PDF processing — see disabled section below.
  28720:  { url: 'https://cdn.1j1ju.com/medias/0d/25/6d-brass-lancashire-rulebook.pdf', note: 'Roxley Games — Brass: Lancashire (1j1ju mirror)' },

  // Feuerland Spiele — publisher-direct
  342942: { url: 'https://www.feuerland-spiele.de/fileadmin/game/Arche_Nova/Arche_Nova_Rules_EN_Low_2022_01.pdf', note: 'Feuerland Spiele — Ark Nova' },
  220308: { url: 'https://www.feuerland-spiele.de/fileadmin/game/Gaia_Project/GAIA_PROJECT_EN_rules_Web.pdf', note: 'Feuerland Spiele — Gaia Project' },

  // Cephalofair — Gloomhaven family (1j1ju mirrors).
  // Both Gloomhaven and Jaws of the Lion fail Anthropic's PDF processing
  // — see disabled section below. Frosthaven was never URL-discoverable.

  // Fantasy Flight Games — publisher-direct CDN
  233078: { url: 'https://images-cdn.fantasyflightgames.com/filer_public/3a/fc/3afce41b-b757-4dc8-b005-3a5efffd0fad/ti4_living_rules_reference_v1_1.pdf', note: 'Fantasy Flight Games — Twilight Imperium: Fourth Edition' },
  187645: { url: 'https://images-cdn.fantasyflightgames.com/filer_public/0b/07/0b07601a-6ac3-4333-ac41-b6d1b9a979da/sw03_learn_to_play_web.pdf', note: 'Fantasy Flight Games — Star Wars: Rebellion (Learn-to-Play)' },

  // GMT Games — publisher-direct
  12333:  { url: 'https://www.gmtgames.com/nnts/TS_Rules-2015.pdf', note: 'GMT Games — Twilight Struggle (2015 rules)' },

  // Repos Production / Asmodee — publisher CDN
  173346: { url: 'https://cdn.svc.asmodee.net/production-rprod/storage/downloads/games/7wonders-duel/en/7du-rules-us-15990558193s5I6.pdf', note: 'Repos Production — 7 Wonders Duel' },

  // Czech Games Edition — publisher-direct (Through the Ages disabled —
  // 35MB PDF fails Anthropic processing, see disabled section).
  312484: { url: 'https://cdn.1j1ju.com/medias/6f/e9/0c-lost-ruins-of-arnak-rulebook.pdf', note: 'Czech Games Edition — Lost Ruins of Arnak (1j1ju mirror)' },
  418059: { url: 'https://filemanager.czechgames.com/storage/files/seti-search-for-extraterrestrial-intelligence/rules/seti-rules-en.pdf', note: 'Czech Games Edition — SETI: Search for Extraterrestrial Intelligence' },

  // Z-Man Games + Asmodee CDN
  161936: { url: 'https://cdn.1j1ju.com/medias/e6/fc/aa-pandemic-legacy-season-1-rulebook.pdf', note: 'Z-Man Games — Pandemic Legacy: Season 1 (1j1ju mirror)' },
  193738: { url: 'https://asmodee-resources.azureedge.net/media/germanyprod/Regeln/Great%20Western%20Trail%202%20Edition-Rulebook.pdf', note: 'Eggertspiele / Stronghold Games — Great Western Trail (2nd Ed)' },

  // Lautapelit — Eclipse (1j1ju mirror)
  246900: { url: 'https://cdn.1j1ju.com/medias/bb/af/07-eclipse-second-dawn-for-the-galaxy-rulebook.pdf', note: 'Lautapelit — Eclipse: Second Dawn for the Galaxy (1j1ju mirror)' },

  // Rio Grande Games — Concordia (English publisher)
  124361: { url: 'https://www.riograndegames.com/wp-content/uploads/2013/10/Concordia_rules_eng_1_1.pdf', note: 'Rio Grande Games — Concordia' },

  // Ravensburger / Alea — Castles of Burgundy (1j1ju mirror)
  84876:  { url: 'https://cdn.1j1ju.com/medias/04/f5/f9-the-castles-of-burgundy-rulebook.pdf', note: 'Ravensburger / Alea — The Castles of Burgundy (1j1ju mirror)' },

  // Contention Games — publisher-direct
  338960: { url: 'https://contentiongames.com/_images/STS_KS_Rulebook.pdf', note: 'Contention Games — Slay the Spire: The Board Game' },

  // Renegade — Clank! Legacy (1j1ju mirror)
  266507: { url: 'https://cdn.1j1ju.com/medias/a0/f1/40-clank-legacy-acquisitions-incorporated-rulebook.pdf', note: 'Renegade Game Studios — Clank! Legacy: Acquisitions Incorporated (1j1ju mirror)' },

  // ─── Known-want games not yet seeded ───
  // 162886 Spirit Island — Greater Than Games hosts via Dropbox folder
  //   share link; HEAD returns HTML, can't validate as PDF without
  //   manually downloading + re-hosting locally.
  // 167355 Nemesis — Awaken Realms returns 403 to scripted requests;
  //   need to find an alternate URL or re-host.

  // ─── Disabled (Anthropic returns "Could not process PDF" 400) ───
  // These Stonemaier print-quality PDFs (image-heavy, very large) trip
  // Anthropic's PDF processing. Wizard answers will use training
  // knowledge for these games until we either compress the PDFs or
  // implement chat-route fallback. The rulebook button still works
  // (BGG /files fallback).
  // 266192: Wingspan (75.9 MB) — Stonemaier
  // 379078: Expeditions (90.6 MB) — Stonemaier
  // 312804: Pendulum (46.1 MB) — Stonemaier
  // 329465: Red Rising (25.1 MB) — Stonemaier
  // 224517: Brass: Birmingham (6.5 MB, 1j1ju mirror) — small but rejected
  // 174430: Gloomhaven (12.8 MB, 1j1ju mirror) — small but rejected
  // 291457: Gloomhaven: Jaws of the Lion (7.4 MB, 1j1ju mirror) — small but rejected
  // 182028: Through the Ages (35.0 MB, czechgames.com) — large
  // Pattern: 1j1ju.com mirrored PDFs trip Anthropic disproportionately
  // (3 of 4 1j1ju picks failed); large publisher PDFs (>30MB) also at risk.
};

export function getRulebookOverride(bggId: number): RulebookOverride | null {
  return RULEBOOK_OVERRIDES[bggId] ?? null;
}
