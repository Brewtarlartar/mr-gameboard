/**
 * Minimal, dependency-free HTML sanitizer for the small amount of formatting
 * that appears in BGG game descriptions (paragraphs, line breaks, emphasis).
 *
 * BGG descriptions are moderated but still user-sourced, and they are rendered
 * with `dangerouslySetInnerHTML`, so raw HTML must never reach the DOM.
 *
 * Pipeline:
 *   1. Decode HTML entities to their real characters (numeric + a named subset)
 *      so legacy/partially-encoded cache rows don't render literal "&ndash;" or
 *      "&#226;" codes. This does NOT strip tags — a decoded "&lt;p&gt;" becomes a
 *      real "<p>" that step 3 can re-allow, and a decoded "&lt;script&gt;" becomes
 *      "<script>" that step 2 immediately re-escapes.
 *   2. Escape EVERYTHING (`<`/`>`/`&`/`"`/`'`). After this there are zero live tags.
 *   3. Re-enable a tiny whitelist of attribute-free formatting tags.
 *
 * Because step 2 escapes every angle bracket and quote, no `<script>`, `onerror=`
 * handler, or `javascript:` URL can survive; step 3 only turns the exact
 * whitelisted tag tokens back into real tags.
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
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
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
  pound: '£',
  euro: '€',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  plusmn: '±',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  times: '×',
  divide: '÷',
};

// Decode entities to real characters WITHOUT stripping tags. Single pass so we
// never re-decode our own output (a decoded "&amp;lt;" stays "&lt;", it does not
// become "<").
function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
        ? NAMED_ENTITIES[name]
        : match,
    );
}

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// Attribute-free formatting tags we allow back in. No <a> (avoids href/JS URLs),
// no <img>, no <span>/<div> (no attributes to smuggle).
const ALLOWED = ['p', 'br', 'em', 'strong', 'i', 'b', 'u', 'ul', 'ol', 'li'];

export function sanitizeDescriptionHtml(input: string): string {
  const decoded = decodeEntities(input);
  const escaped = decoded.replace(/[&<>"']/g, (c) => ESCAPE[c]);
  let out = escaped;
  for (const tag of ALLOWED) {
    // Re-enable <tag>, </tag>, and the self-closing <br/> form only.
    out = out
      .replace(new RegExp(`&lt;${tag}&gt;`, 'gi'), `<${tag}>`)
      .replace(new RegExp(`&lt;/${tag}&gt;`, 'gi'), `</${tag}>`)
      .replace(new RegExp(`&lt;${tag}\\s*/&gt;`, 'gi'), `<${tag}/>`);
  }
  return out;
}
