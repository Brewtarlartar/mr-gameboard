/**
 * Minimal, dependency-free HTML sanitizer for the small amount of formatting
 * that appears in BGG game descriptions (paragraphs, line breaks, emphasis).
 *
 * BGG descriptions are moderated but still user-sourced, and they are rendered
 * with `dangerouslySetInnerHTML`, so raw HTML must never reach the DOM. Strategy:
 * escape EVERYTHING, then re-enable a tiny whitelist of safe, attribute-free
 * formatting tags. There is no way for a `<script>`, an `onerror=` handler, or a
 * `javascript:` URL to survive, because every `<`/`>`/`&`/`"` is escaped first
 * and only the exact whitelisted tag tokens are turned back into real tags.
 */

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
  const escaped = input.replace(/[&<>"']/g, (c) => ESCAPE[c]);
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
