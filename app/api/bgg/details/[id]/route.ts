import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface BGGComment {
  username: string;
  rating: number | null;
  comment: string;
  date: string;
}

interface BGGGameDetails {
  id: string;
  name: string;
  description: string;
  image: string | null;
  thumbnail: string | null;
  yearPublished: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  minAge: number | null;
  rating: number | null;
  weight: number | null;
  numRatings: number | null;
  rank: number | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  comments: BGGComment[];
  howToPlaySummary: string | null;
}

// Fetch and parse BGG XML API for game details
async function fetchGameDetails(gameId: string): Promise<BGGGameDetails | null> {
  try {
    // Fetch basic game info with stats
    const xmlUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`;
    const response = await fetch(xmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error(`BGG XML API error: ${response.status}`);
      return null;
    }

    const xmlText = await response.text();

    const $ = cheerio.load(xmlText, { xmlMode: true });

    const item = $('item').first();
    if (!item.length) return null;

    // Parse basic data
    // Description in BGG XML - try multiple methods to extract it
    let rawDescription = '';
    
    // Method 1: Try cheerio's text() method first (most reliable)
    const descriptionElement = item.find('description').first();
    if (descriptionElement.length) {
      rawDescription = descriptionElement.text() || '';
    }
    
    // Method 2: If that failed, try regex on raw XML
    if (!rawDescription || rawDescription.length < 50) {
      const descMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/i);
      if (descMatch && descMatch[1]) {
        rawDescription = descMatch[1].trim();
      }
    }
    
    // Method 3: Try to extract from CDATA if present
    if (!rawDescription || rawDescription.length < 50) {
      const cdataMatch = xmlText.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/i);
      if (cdataMatch && cdataMatch[1]) {
        rawDescription = cdataMatch[1].trim();
      }
    }
    
    const decodedDescription = decodeHtmlEntities(rawDescription);

    const details: BGGGameDetails = {
      id: gameId,
      name: item.find('name[type="primary"]').attr('value') || '',
      description: decodedDescription,
      image: item.find('image').text() || null,
      thumbnail: item.find('thumbnail').text() || null,
      yearPublished: parseInt(item.find('yearpublished').attr('value') || '0') || null,
      minPlayers: parseInt(item.find('minplayers').attr('value') || '0') || null,
      maxPlayers: parseInt(item.find('maxplayers').attr('value') || '0') || null,
      playingTime: parseInt(item.find('playingtime').attr('value') || '0') || null,
      minPlayTime: parseInt(item.find('minplaytime').attr('value') || '0') || null,
      maxPlayTime: parseInt(item.find('maxplaytime').attr('value') || '0') || null,
      minAge: parseInt(item.find('minage').attr('value') || '0') || null,
      rating: parseFloat(item.find('statistics ratings average').attr('value') || '0') || null,
      weight: parseFloat(item.find('statistics ratings averageweight').attr('value') || '0') || null,
      numRatings: parseInt(item.find('statistics ratings usersrated').attr('value') || '0') || null,
      rank: null,
      categories: [],
      mechanics: [],
      designers: [],
      publishers: [],
      comments: [],
      howToPlaySummary: null,
    };

    // Parse rank
    const rankNode = item.find('rank[name="boardgame"]');
    if (rankNode.length) {
      const rankVal = rankNode.attr('value');
      if (rankVal && rankVal !== 'Not Ranked') {
        details.rank = parseInt(rankVal);
      }
    }

    // Parse categories
    item.find('link[type="boardgamecategory"]').each((_, el) => {
      const catName = $(el).attr('value');
      if (catName) details.categories.push(catName);
    });

    // Parse mechanics
    item.find('link[type="boardgamemechanic"]').each((_, el) => {
      const mechName = $(el).attr('value');
      if (mechName) details.mechanics.push(mechName);
    });

    // Parse designers
    item.find('link[type="boardgamedesigner"]').each((_, el) => {
      const designerName = $(el).attr('value');
      if (designerName) details.designers.push(designerName);
    });

    // Parse publishers
    item.find('link[type="boardgamepublisher"]').each((_, el) => {
      const pubName = $(el).attr('value');
      if (pubName) details.publishers.push(pubName);
    });

    // Fetch comments separately
    details.comments = await fetchGameComments(gameId);

    // Generate how-to-play summary from description
    details.howToPlaySummary = generateHowToPlaySummary(details.description);

    return details;
  } catch (error) {
    console.error('Error fetching BGG details:', error);
    return null;
  }
}

// Fetch recent comments for the game
async function fetchGameComments(gameId: string): Promise<BGGComment[]> {
  try {
    const commentsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&comments=1&pagesize=10`;
    const response = await fetch(commentsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) return [];

    const xmlText = await response.text();
    const $ = cheerio.load(xmlText, { xmlMode: true });

    const comments: BGGComment[] = [];
    
    $('comment').each((i, el) => {
      if (i >= 5) return false; // Limit to 5 comments
      
      const $el = $(el);
      const username = $el.attr('username') || 'Anonymous';
      const ratingStr = $el.attr('rating');
      const rating = ratingStr && ratingStr !== 'N/A' ? parseFloat(ratingStr) : null;
      const commentText = $el.attr('value') || '';
      
      // Only include comments with actual text
      if (commentText.trim().length > 10) {
        comments.push({
          username,
          rating,
          comment: commentText.trim(),
          date: '', // BGG doesn't provide date in this endpoint
        });
      }
    });

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#10;/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Generate a brief how-to-play summary from description
function generateHowToPlaySummary(description: string): string | null {
  if (!description || description.length < 100) return null;

  // Take first 2-3 sentences that describe gameplay
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Look for sentences mentioning gameplay keywords
  const gameplayKeywords = ['player', 'turn', 'win', 'score', 'play', 'move', 'roll', 'draw', 'place', 'build', 'collect'];
  
  const relevantSentences = sentences.filter(sentence => 
    gameplayKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  ).slice(0, 3);

  if (relevantSentences.length > 0) {
    return relevantSentences.join('. ').trim() + '.';
  }

  // Fallback: first 2 sentences
  return sentences.slice(0, 2).join('. ').trim() + '.';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }

    const details = await fetchGameDetails(id);
    
    if (!details) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error in BGG details API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}

