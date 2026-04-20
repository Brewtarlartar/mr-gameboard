/**
 * Defensive HTML/entity cleanup for text that may have come from BGG (or any
 * external source) and been stored partially decoded.
 *
 * The server-side decoder in `lib/bgg/api.ts` handles entities at fetch time,
 * but older rows in the Supabase cache were saved with a much smaller decoder
 * and still contain raw `&#226;`, `&ndash;`, `<br/>`, etc. This utility cleans
 * those at render time so users don't have to re-enrich their library to get
 * readable descriptions.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  laquo: '«',
  raquo: '»',
  copy: '©',
  reg: '®',
  trade: '™',
  middot: '·',
  bull: '•',
  deg: '°',
  iexcl: '¡',
  iquest: '¿',
  szlig: 'ß',
  Auml: 'Ä',
  auml: 'ä',
  Ouml: 'Ö',
  ouml: 'ö',
  Uuml: 'Ü',
  uuml: 'ü',
  Aacute: 'Á',
  aacute: 'á',
  Eacute: 'É',
  eacute: 'é',
  Iacute: 'Í',
  iacute: 'í',
  Oacute: 'Ó',
  oacute: 'ó',
  Uacute: 'Ú',
  uacute: 'ú',
  Ntilde: 'Ñ',
  ntilde: 'ñ',
};

export function decodeHtmlEntities(input: string | null | undefined): string {
  if (!input) return '';
  return (
    input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      })
      .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) => {
        return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
          ? NAMED_ENTITIES[name]
          : match;
      })
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
