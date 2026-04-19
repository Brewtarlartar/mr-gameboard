/**
 * Curated supplement of ubiquitous board games that aren't in the
 * BGG top-500 hobby seed but get searched constantly (Catan, Monopoly,
 * UNO, etc.). Verified BGG IDs so the detail panel can enrich on demand.
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
      'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/qDibwS-9V8b-Tdk_QtGgW1XnYqc=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
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
    minPlayers: 2,
    maxPlayers: 5,
    playingTime: 15,
    description: 'A kitty-powered version of Russian Roulette.',
    rating: 6.1,
    categories: ['Card Game', 'Party Game'],
  },
  {
    bggId: 2381,
    name: 'Sequence',
    yearPublished: 1982,
    minPlayers: 2,
    maxPlayers: 12,
    playingTime: 30,
    description: 'Form rows of five chips on the board.',
    rating: 6.0,
    categories: ['Card Game', 'Family Game'],
  },
  {
    bggId: 1198,
    name: 'Pictionary',
    yearPublished: 1985,
    minPlayers: 4,
    maxPlayers: 16,
    playingTime: 90,
    description: 'The classic team drawing game.',
    rating: 5.7,
    categories: ['Party Game'],
  },
  {
    bggId: 1782,
    name: 'Trivial Pursuit',
    yearPublished: 1981,
    minPlayers: 2,
    maxPlayers: 24,
    playingTime: 90,
    description: 'Test your trivia across six categories.',
    rating: 5.4,
    categories: ['Trivia'],
  },
  {
    bggId: 1116,
    name: 'Apples to Apples',
    yearPublished: 1999,
    minPlayers: 4,
    maxPlayers: 10,
    playingTime: 30,
    description: 'The hilarious party game of crazy comparisons.',
    rating: 5.7,
    categories: ['Party Game', 'Card Game'],
  },
  {
    bggId: 124708,
    name: 'Cards Against Humanity',
    yearPublished: 2011,
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
    minPlayers: 2,
    maxPlayers: 2,
    playingTime: 30,
    description: 'The royal game.',
    rating: 7.5,
    categories: ['Abstract Strategy'],
  },
  {
    bggId: 2398,
    name: 'Backgammon',
    yearPublished: -3000,
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
