/**
 * Shared BGG XML API client.
 *
 * Reads `BGG_API_TOKEN` from the environment. When the token is present,
 * every request is sent with `Authorization: Bearer <token>` so that
 * BGG's anonymous-blocking 401s don't break us.
 *
 * Without a token, requests still go out (so local dev works for any IPs
 * BGG hasn't blocked), but most calls will likely fail until you set
 * `BGG_API_TOKEN` in `.env.local`.
 */

export interface BggCacheRow {
  bgg_id: number;
  name: string;
  description: string | null;
  image: string | null;
  thumbnail: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  min_playing_time: number | null;
  max_playing_time: number | null;
  complexity: number | null;
  rating: number | null;
  year_published: number | null;
  rank: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  artists: string[];
  publishers: string[];
  last_synced_at: string;
}

export interface BggSearchHit {
  id: number;
  name: string;
  yearPublished?: number;
}

const BGG_BASE = 'https://boardgamegeek.com/xmlapi2';

export function hasBggToken(): boolean {
  return Boolean(process.env.BGG_API_TOKEN && process.env.BGG_API_TOKEN.trim());
}

function bggHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/xml, text/xml, */*',
    'User-Agent': process.env.BGG_USER_AGENT || 'TheTome/1.0 (mr-gameboard)',
  };
  const token = process.env.BGG_API_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: bggHeaders(),
      signal: ctl.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(t);
  }
}

// --- XML helpers ---
function getAttr(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}[^>]*value="([^"]*)"`, 'i'));
  return m ? m[1] : undefined;
}

function getInner(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : undefined;
}

// Common HTML named entities that show up in BGG descriptions.
// Numeric entities (&#NNN; and &#xHH;) are handled separately below.
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

function decodeBggHtml(input: string): string {
  return (
    input
      // Convert BGG-style line breaks first so the resulting newlines survive
      // the tag-stripping pass below.
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      // Numeric character references: hex (&#xNN;) and decimal (&#NNN;).
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : '';
      })
      // Named entities (after numeric so we don't double-decode).
      .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name) => {
        return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
          ? NAMED_ENTITIES[name]
          : match;
      })
      // Collapse runs of 3+ newlines down to a paragraph break, and trim
      // trailing whitespace on each line.
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function collectLinks(xml: string, type: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<link[^>]*type="${type}"[^>]*value="([^"]*)"`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function numOrNull(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Convert a `<thing>` XML response from BGG into a cache row.
 * Returns null if the XML doesn't contain a primary name.
 */
export function parseBggThingXml(bggId: number, xml: string): BggCacheRow | null {
  const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/i);
  if (!nameMatch) return null;
  const name = nameMatch[1];

  const rawDescription = getInner(xml, 'description');
  const description = rawDescription ? decodeBggHtml(rawDescription) : null;
  const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"/i);
  const weightMatch = xml.match(/<averageweight[^>]*value="([^"]*)"/i);
  const rankMatch = xml.match(/<rank[^>]*name="boardgame"[^>]*value="([^"]*)"/i);

  return {
    bgg_id: bggId,
    name,
    description: description || null,
    image: getInner(xml, 'image') || null,
    thumbnail: getInner(xml, 'thumbnail') || null,
    min_players: numOrNull(getAttr(xml, 'minplayers')),
    max_players: numOrNull(getAttr(xml, 'maxplayers')),
    playing_time: numOrNull(getAttr(xml, 'playingtime')),
    min_playing_time: numOrNull(getAttr(xml, 'minplaytime')),
    max_playing_time: numOrNull(getAttr(xml, 'maxplaytime')),
    complexity: weightMatch ? parseFloat(weightMatch[1]) : null,
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    year_published: numOrNull(getAttr(xml, 'yearpublished')),
    rank:
      rankMatch && rankMatch[1] !== 'Not Ranked' ? parseInt(rankMatch[1], 10) : null,
    categories: collectLinks(xml, 'boardgamecategory'),
    mechanics: collectLinks(xml, 'boardgamemechanic'),
    designers: collectLinks(xml, 'boardgamedesigner'),
    artists: collectLinks(xml, 'boardgameartist'),
    publishers: collectLinks(xml, 'boardgamepublisher'),
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Fetch a single game's full details from BGG. Honors `BGG_API_TOKEN`.
 * Returns the parsed cache row, or null on any failure.
 */
export async function fetchBggThing(
  bggId: number,
  opts: { timeoutMs?: number } = {},
): Promise<BggCacheRow | null> {
  try {
    const res = await fetchWithTimeout(
      `${BGG_BASE}/thing?id=${bggId}&stats=1`,
      opts.timeoutMs ?? 8000,
    );
    if (!res.ok) {
      console.warn(`[BGG] thing ${bggId} -> HTTP ${res.status}`);
      return null;
    }
    const xml = await res.text();
    if (xml.includes('<error>') || xml.includes('Rate limit')) {
      console.warn(`[BGG] thing ${bggId} returned error/rate-limit`);
      return null;
    }
    return parseBggThingXml(bggId, xml);
  } catch (err) {
    console.warn(`[BGG] thing ${bggId} fetch failed:`, err);
    return null;
  }
}

/**
 * Live BGG search. Honors `BGG_API_TOKEN`.
 * Returns parsed hits, or null on any failure (so callers can fall back).
 */
export async function fetchBggSearch(
  query: string,
  opts: { timeoutMs?: number; limit?: number } = {},
): Promise<BggSearchHit[] | null> {
  const cleanQuery = query.replace(/[®™©]/g, '').replace(/:\s*/g, ' ').trim();
  if (!cleanQuery) return [];

  try {
    const url = `${BGG_BASE}/search?query=${encodeURIComponent(cleanQuery)}&type=boardgame`;
    const res = await fetchWithTimeout(url, opts.timeoutMs ?? 6000);
    if (!res.ok) {
      console.warn(`[BGG] search "${cleanQuery}" -> HTTP ${res.status}`);
      return null;
    }
    const xml = await res.text();
    if (xml.includes('<error>') || xml.includes('Rate limit')) return null;

    const hits: BggSearchHit[] = [];
    const itemRe = /<item\s+[^>]*id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRe.exec(xml)) !== null) {
      const id = parseInt(m[1], 10);
      const inner = m[2];
      const primary = inner.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/i);
      const any = inner.match(/<name[^>]*value="([^"]*)"/i);
      const name = primary ? primary[1] : any ? any[1] : null;
      const yearMatch = inner.match(/<yearpublished[^>]*value="(\d+)"/i);
      if (id && name) {
        hits.push({
          id,
          name,
          yearPublished: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
        });
      }
    }

    const limit = opts.limit ?? 20;
    return hits.slice(0, limit);
  } catch (err) {
    console.warn(`[BGG] search fetch failed:`, err);
    return null;
  }
}
