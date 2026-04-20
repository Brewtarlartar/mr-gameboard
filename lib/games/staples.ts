/**
 * Curated supplement of ubiquitous board games that aren't in the
 * BGG top-500 hobby seed but get searched constantly (Catan, Monopoly,
 * UNO, etc.). Verified BGG IDs and current cf.geekdo-images.com art so
 * the catalog and library always render with proper thumbnails — even
 * when no `BGG_API_TOKEN` is configured to enrich on demand.
 */

import { Game } from '@/types/game';

interface Staple {
  bggId: number;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  description?: string;
  rating?: number;
  rank?: number;
  categories?: string[];
}

const STAPLES: Staple[] = [
  {
    bggId: 13,
    name: 'CATAN',
    yearPublished: 1995,
    thumbnail:
      'https://cf.geekdo-images.com/0XODRpReiZBFUffEcqT5-Q__small/img/SNVfF23OQafv3u8xdFolJnMkBoM=/fit-in/200x150/filters:strip_icc()/pic9156909.png',
    image:
      'https://cf.geekdo-images.com/0XODRpReiZBFUffEcqT5-Q__original/img/oRc0AomWA9ZtFqQDZiZbIyKE1j0=/0x0/filters:format(png)/pic9156909.png',
    minPlayers: 3,
    maxPlayers: 4,
    playingTime: 120,
    description:
      'Trade, build and settle on the island of Catan in this all-time gateway classic.',
    rating: 7.1,
    categories: ['Negotiation', 'Family Game'],
  },
  {
    bggId: 1406,
    name: 'Monopoly',
    yearPublished: 1933,
    thumbnail:
      'https://cf.geekdo-images.com/9nGoBZ0MRbi6rdH47sj2Qg__small/img/ezXcyEsHhS9iRxmuGe8SmiLLXlM=/fit-in/200x150/filters:strip_icc()/pic5786795.jpg',
    image:
      'https://cf.geekdo-images.com/9nGoBZ0MRbi6rdH47sj2Qg__original/img/bA8irydTCNlE38QSzM9EhcUIuNU=/0x0/filters:format(jpeg)/pic5786795.jpg',
    minPlayers: 2,
    maxPlayers: 8,
    playingTime: 180,
    description: 'The classic real-estate trading game.',
    rating: 4.4,
    categories: ['Economic', 'Family Game'],
  },
  {
    bggId: 181,
    name: 'Risk',
    yearPublished: 1959,
    thumbnail:
      'https://cf.geekdo-images.com/Oem1TTtSgxOghRFCoyWRPw__small/img/5cltSV60oVvjL3Ag_KTJbmTdU6w=/fit-in/200x150/filters:strip_icc()/pic4916782.jpg',
    image:
      'https://cf.geekdo-images.com/Oem1TTtSgxOghRFCoyWRPw__original/img/Nu3eXPyOkhtnR3hhpUrtgqRMAfs=/0x0/filters:format(jpeg)/pic4916782.jpg',
    minPlayers: 2,
    maxPlayers: 6,
    playingTime: 240,
    description:
      'Conquer the world in the original wargame of global domination.',
    rating: 5.6,
    categories: ['Wargame'],
  },
  {
    bggId: 1294,
    name: 'Clue / Cluedo',
    yearPublished: 1949,
    thumbnail:
      'https://cf.geekdo-images.com/wNcbhLJGGjakYjjm1gV_kQ__small/img/yaeAeMVffkAZEjgYs0DvT4Zk2z0=/fit-in/200x150/filters:strip_icc()/pic7563466.png',
    image:
      'https://cf.geekdo-images.com/wNcbhLJGGjakYjjm1gV_kQ__original/img/Ji1MKh8gogtczoDecOi5D5yo9hQ=/0x0/filters:format(png)/pic7563466.png',
    minPlayers: 3,
    maxPlayers: 6,
    playingTime: 45,
    description: 'Deduce the murderer, weapon and room.',
    rating: 5.7,
    categories: ['Deduction'],
  },
  {
    bggId: 320,
    name: 'Scrabble',
    yearPublished: 1948,
    thumbnail:
      'https://cf.geekdo-images.com/mVmmntn2oQd0PfFrWBvwIQ__small/img/RUmuGCB40FQH0en0R2nrcsSO7DE=/fit-in/200x150/filters:strip_icc()/pic404651.jpg',
    image:
      'https://cf.geekdo-images.com/mVmmntn2oQd0PfFrWBvwIQ__original/img/11jrKPiOVTNl5NwX83KGtTZEq40=/0x0/filters:format(jpeg)/pic404651.jpg',
    minPlayers: 2,
    maxPlayers: 4,
    playingTime: 90,
    description: 'The classic crossword-tile word game.',
    rating: 6.3,
    categories: ['Word Game'],
  },
  {
    bggId: 2223,
    name: 'UNO',
    yearPublished: 1971,
    thumbnail:
      'https://cf.geekdo-images.com/-DHiHBBSnvaLu0Do8CIykQ__small/img/AUkAjClJAk3BX1vEpk7EasSh_44=/fit-in/200x150/filters:strip_icc()/pic8204165.jpg',
    image:
      'https://cf.geekdo-images.com/-DHiHBBSnvaLu0Do8CIykQ__original/img/fRfoyWezpQsumExNKVxf1cwtJfg=/0x0/filters:format(jpeg)/pic8204165.jpg',
    minPlayers: 2,
    maxPlayers: 10,
    playingTime: 30,
    description: 'Match by color or number — and yell UNO.',
    rating: 5.4,
    categories: ['Card Game', 'Family Game'],
  },
  {
    bggId: 172225,
    name: 'Exploding Kittens',
    yearPublished: 2015,
    thumbnail:
      'https://cf.geekdo-images.com/N8bL53-pRU7zaXDTrEaYrw__small/img/3tH4pIc1Udzkd0tXc6MgVQ59BC0=/fit-in/200x150/filters:strip_icc()/pic2691976.png',
    image:
      'https://cf.geekdo-images.com/N8bL53-pRU7zaXDTrEaYrw__original/img/0ciN1VZYifUd0qIDO0e8cGXmiss=/0x0/filters:format(png)/pic2691976.png',
    minPlayers: 2,
    maxPlayers: 5,
    playingTime: 15,
    description: 'A kitty-powered version of Russian Roulette.',
    rating: 6.1,
    categories: ['Card Game', 'Party Game'],
  },
  {
    // Corrected: BGG 2381 was Scattergories. Sequence is BGG 2375.
    bggId: 2375,
    name: 'Sequence',
    yearPublished: 1982,
    thumbnail:
      'https://cf.geekdo-images.com/VosGBqkOjkhgC2QFS1o3_g__small/img/PNwWrQIQNo757BtoW6Hniy3P-cw=/fit-in/200x150/filters:strip_icc()/pic212893.jpg',
    image:
      'https://cf.geekdo-images.com/VosGBqkOjkhgC2QFS1o3_g__original/img/ZIc1p75HIEOIwtKy9ZIHsP2l0zQ=/0x0/filters:format(jpeg)/pic212893.jpg',
    minPlayers: 2,
    maxPlayers: 12,
    playingTime: 30,
    description: 'Form rows of five chips on the board.',
    rating: 6.0,
    categories: ['Card Game', 'Family Game'],
  },
  {
    // Corrected: BGG 1198 was SET. Pictionary is BGG 2281.
    bggId: 2281,
    name: 'Pictionary',
    yearPublished: 1985,
    thumbnail:
      'https://cf.geekdo-images.com/YfUxodD7JSqYitxvjXB69Q__small/img/7ls1a8ak5oT7BaKM-rVHpOVrP14=/fit-in/200x150/filters:strip_icc()/pic5147022.png',
    image:
      'https://cf.geekdo-images.com/YfUxodD7JSqYitxvjXB69Q__original/img/YRJAlLzkxMuJHVPsdnBLNFpoODA=/0x0/filters:format(png)/pic5147022.png',
    minPlayers: 3,
    maxPlayers: 16,
    playingTime: 90,
    description: 'The classic team drawing game.',
    rating: 5.7,
    categories: ['Party Game'],
  },
  {
    // Corrected: BGG 1782 was Ancients. Trivial Pursuit (Genus) is BGG 2952.
    bggId: 2952,
    name: 'Trivial Pursuit',
    yearPublished: 1981,
    thumbnail:
      'https://cf.geekdo-images.com/CSILODNknzqhsDxeP8jmgw__small/img/y7sMTmQw3P-tX8MvFQImbf4pUFs=/fit-in/200x150/filters:strip_icc()/pic6912883.jpg',
    image:
      'https://cf.geekdo-images.com/CSILODNknzqhsDxeP8jmgw__original/img/ipoGqNe4Dt7hAF3pzd5bxWnKoEQ=/0x0/filters:format(jpeg)/pic6912883.jpg',
    minPlayers: 2,
    maxPlayers: 24,
    playingTime: 90,
    description: 'Test your trivia across six categories.',
    rating: 5.4,
    categories: ['Trivia'],
  },
  {
    // Corrected: BGG 1116 was Oh Hell!. Apples to Apples is BGG 74.
    bggId: 74,
    name: 'Apples to Apples',
    yearPublished: 1999,
    thumbnail:
      'https://cf.geekdo-images.com/S5GzB_f2Re3kEDoSxqG5Ew__small/img/kJ1JQ_d9xEZ00sJ1dLvwyQYiQUA=/fit-in/200x150/filters:strip_icc()/pic213515.jpg',
    image:
      'https://cf.geekdo-images.com/S5GzB_f2Re3kEDoSxqG5Ew__original/img/K49MN0Ij_tZOgDK4znCUJGu6aU4=/0x0/filters:format(jpeg)/pic213515.jpg',
    minPlayers: 4,
    maxPlayers: 10,
    playingTime: 30,
    description: 'The hilarious party game of crazy comparisons.',
    rating: 5.7,
    categories: ['Party Game', 'Card Game'],
  },
  {
    // Corrected: BGG 124708 was Mice and Mystics. Cards Against Humanity is BGG 50381.
    bggId: 50381,
    name: 'Cards Against Humanity',
    yearPublished: 2009,
    thumbnail:
      'https://cf.geekdo-images.com/nYLrPiI9gnvlrwOrKQ4_CA__small/img/fIhQLjWueNPYZhCZ_LzjAIhPm5U=/fit-in/200x150/filters:strip_icc()/pic2909692.jpg',
    image:
      'https://cf.geekdo-images.com/nYLrPiI9gnvlrwOrKQ4_CA__original/img/EgMpdhoG38LUTApk0kyFFsmoQPk=/0x0/filters:format(jpeg)/pic2909692.jpg',
    minPlayers: 4,
    maxPlayers: 20,
    playingTime: 30,
    description: 'A party game for horrible people.',
    rating: 6.3,
    categories: ['Party Game', 'Card Game'],
  },
  {
    bggId: 1927,
    name: 'Munchkin',
    yearPublished: 2001,
    thumbnail:
      'https://cf.geekdo-images.com/J-ts3MW0UhDzs621TR6cog__small/img/8hVkpMC5pDLr6ARI_4gI4N3aF5M=/fit-in/200x150/filters:strip_icc()/pic1871016.jpg',
    image:
      'https://cf.geekdo-images.com/J-ts3MW0UhDzs621TR6cog__original/img/FbqPPCilgZKND2xmhWJgkfjZiYE=/0x0/filters:format(jpeg)/pic1871016.jpg',
    minPlayers: 3,
    maxPlayers: 6,
    playingTime: 90,
    description: 'Kill the monsters, steal the treasure, stab your buddy.',
    rating: 6.0,
    categories: ['Card Game', 'Fantasy'],
  },
  {
    bggId: 41114,
    name: 'The Resistance',
    yearPublished: 2009,
    thumbnail:
      'https://cf.geekdo-images.com/cAPTkL2BR3snLO71dkH8rw__small/img/5lDn1W82rlLXtVG7nPIYR9Orn-4=/fit-in/200x150/filters:strip_icc()/pic2576459.jpg',
    image:
      'https://cf.geekdo-images.com/cAPTkL2BR3snLO71dkH8rw__original/img/_UahoIUTqh39xRqzCc2jwgdYbSA=/0x0/filters:format(jpeg)/pic2576459.jpg',
    minPlayers: 5,
    maxPlayers: 10,
    playingTime: 30,
    description: 'A social-deduction game of spies and rebels.',
    rating: 7.2,
    categories: ['Bluffing', 'Party Game'],
  },
  {
    bggId: 2243,
    name: 'Yahtzee',
    yearPublished: 1956,
    thumbnail:
      'https://cf.geekdo-images.com/dp-pJkUemCjhrwi9QItrPA__small/img/jzdzVAjd75yiZkIoJ4JsindSmCs=/fit-in/200x150/filters:strip_icc()/pic378237.jpg',
    image:
      'https://cf.geekdo-images.com/dp-pJkUemCjhrwi9QItrPA__original/img/eeYPdva8ti4Hi2PYxkTLRPrtfKk=/0x0/filters:format(jpeg)/pic378237.jpg',
    minPlayers: 1,
    maxPlayers: 8,
    playingTime: 30,
    description: 'The classic dice-rolling game of luck and choices.',
    rating: 5.6,
    categories: ['Dice'],
  },
  {
    bggId: 2719,
    name: 'Connect Four',
    yearPublished: 1974,
    thumbnail:
      'https://cf.geekdo-images.com/I_ZPIWEvFlrMa8caT4UD-w__small/img/JR0u-AXmZpNrZpevcz3lrLPNDf4=/fit-in/200x150/filters:strip_icc()/pic859430.jpg',
    image:
      'https://cf.geekdo-images.com/I_ZPIWEvFlrMa8caT4UD-w__original/img/w93rimjstxQr4BVmaZ_Tl5pQGOw=/0x0/filters:format(jpeg)/pic859430.jpg',
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 10,
    description: 'Get four of your discs in a row.',
    rating: 4.6,
    categories: ['Abstract Strategy'],
  },
  {
    bggId: 2425,
    name: 'Battleship',
    yearPublished: 1931,
    thumbnail:
      'https://cf.geekdo-images.com/oWcB33sfig9QF_KBEv7iLQ__small/img/qczOMhLMAddodKHspHSXyYqZ578=/fit-in/200x150/filters:strip_icc()/pic2439783.png',
    image:
      'https://cf.geekdo-images.com/oWcB33sfig9QF_KBEv7iLQ__original/img/retN48ZHxCC5YaECdlWjRdWHPGs=/0x0/filters:format(png)/pic2439783.png',
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 30,
    description: "Sink your opponent's fleet on the hidden grid.",
    rating: 5.0,
    categories: ['Wargame'],
  },
  {
    bggId: 171,
    name: 'Chess',
    yearPublished: 1475,
    thumbnail:
      'https://cf.geekdo-images.com/0_RWFMNapgr5yCrdhvGi_Q__small/img/Ag-pVSHp3iBail0FsibR_iUMmQc=/fit-in/200x150/filters:strip_icc()/pic8785991.jpg',
    image:
      'https://cf.geekdo-images.com/0_RWFMNapgr5yCrdhvGi_Q__original/img/c4SiusUQuh7uc0k6HDwIXYsEc8M=/0x0/filters:format(jpeg)/pic8785991.jpg',
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 30,
    description: 'The royal game.',
    rating: 7.5,
    categories: ['Abstract Strategy'],
  },
  {
    // Corrected: BGG 2398 was Cribbage. Backgammon is BGG 2397.
    bggId: 2397,
    name: 'Backgammon',
    yearPublished: -3000,
    thumbnail:
      'https://cf.geekdo-images.com/fuNntWUQ8NsmbF7S1gn5GQ__small/img/tv2ubRXyRTwkDSea-LyI4Em75U8=/fit-in/200x150/filters:strip_icc()/pic4017988.jpg',
    image:
      'https://cf.geekdo-images.com/fuNntWUQ8NsmbF7S1gn5GQ__original/img/cfDTqkeGXw1X-PUcnQslg2uR4nA=/0x0/filters:format(jpeg)/pic4017988.jpg',
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 30,
    description: 'One of the oldest known board games.',
    rating: 6.7,
    categories: ['Abstract Strategy', 'Dice'],
  },
];

let _cache: Game[] | null = null;

export function getStapleGames(): Game[] {
  if (_cache) return _cache;
  _cache = STAPLES.map((s) => ({
    id: `bgg-${s.bggId}`,
    bggId: s.bggId,
    name: s.name,
    description: s.description,
    image: s.image,
    thumbnail: s.thumbnail,
    minPlayers: s.minPlayers,
    maxPlayers: s.maxPlayers,
    playingTime: s.playingTime,
    rating: s.rating,
    rank: s.rank,
    yearPublished: s.yearPublished,
    categories: s.categories || [],
    mechanics: [],
    genres: s.categories || [],
  }));
  return _cache;
}
