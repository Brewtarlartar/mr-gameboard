# Game Library Enrichment System

## Overview

The Library Enrichment system ensures that all games in your collection have complete, high-quality descriptions and metadata from BoardGameGeek (BGG). Some games may have been added with incomplete data, and this system automatically fills in the missing information.

## Problem

When games are added to your library, they may have:
- **Missing descriptions** - No description at all
- **Truncated descriptions** - Descriptions cut off at 200-1000 characters
- **Missing metadata** - Categories, mechanics, ratings, etc.
- **Outdated information** - Data that needs refreshing

This happens because:
1. Some games were added before the full BGG integration
2. API rate limits or errors during initial fetching
3. BGG data was incomplete at the time of adding
4. Manual/custom game entries

## Solution

### Automatic Enrichment

The enrichment system automatically:
1. **Detects** games with missing or incomplete data
2. **Fetches** complete information from BGG's API
3. **Updates** your library with full descriptions and metadata
4. **Preserves** existing data (won't overwrite good data)

### How to Use

#### Method 1: UI Button (Recommended)

1. Open your **Game Library** page
2. If any games need enrichment, you'll see an orange **"Enrich Descriptions (X)"** button
3. Click the button to start automatic enrichment
4. Wait for the process to complete (about 0.3 seconds per game)
5. You'll see a success message when done

#### Method 2: Browser Console Script

If the UI button isn't working or you prefer a manual approach:

1. Open your browser console (`F12` or `Cmd+Opt+J`)
2. Run the enrichment script:

```javascript
// Option A: Load and run the script
fetch('/scripts/enrich-library.js')
  .then(r => r.text())
  .then(eval);

// Option B: Use the API directly
fetch('/api/library/enrich', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    games: JSON.parse(localStorage.getItem('mr-boardgame-library'))
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('mr-boardgame-library', JSON.stringify(data.enrichedGames));
  console.log('Enriched:', data.stats);
  location.reload();
});
```

## Technical Details

### API Endpoint

**POST** `/api/library/enrich`

**Request:**
```json
{
  "games": [
    {
      "id": "bgg-174430",
      "bggId": 174430,
      "name": "Gloomhaven",
      "description": "...",
      // ... other fields
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "enrichedGames": [...],
  "stats": {
    "total": 50,
    "enriched": 15,
    "failed": 0
  },
  "errors": []
}
```

### Storage Functions

New functions in `lib/storage.ts`:

- `updateGameLibrary(games)` - Batch update all games
- `getGamesNeedingEnrichment()` - Find games with incomplete data

### Store Actions

New actions in `lib/store/gameStore.ts`:

- `enrichLibrary()` - Main enrichment function
- `getGamesNeedingEnrichment()` - Check which games need enrichment

## What Gets Enriched

The system enriches the following fields if missing or incomplete:

### Primary Data
- ✅ **Description** (full text, no truncation)
- ✅ **Image** (high-resolution cover)
- ✅ **Thumbnail** (preview image)

### Game Stats
- ✅ **Player Count** (min/max players)
- ✅ **Playing Time** (min/max/average)
- ✅ **Year Published**
- ✅ **Rating** (BGG average rating)
- ✅ **Complexity** (weight score)

### Categorization
- ✅ **Categories** (up to 5)
- ✅ **Mechanics** (up to 5)
- ✅ **Genres** (derived from categories)

### Links
- ✅ **Rulebook URL** (BGG files page)

## Enrichment Logic

The system follows these rules:

1. **Skip games without BGG ID** - Custom games can't be enriched
2. **Check description length** - Enrich if missing or < 200 characters
3. **Fetch from BGG** - Use official XML API
4. **Merge data intelligently** - Keep existing good data
5. **Rate limit** - 300ms delay between requests
6. **Error handling** - Continue on failure, report at end

### Smart Merging

The enrichment uses the **nullish coalescing operator** (`??`) to preserve existing data:

```typescript
enrichedGame = {
  ...game,
  description: newDescription || game.description,
  image: newImage || game.image,
  rating: game.rating ?? newRating, // Only if missing
  // etc.
}
```

This ensures:
- ✅ Won't overwrite good existing data
- ✅ Only fills in missing fields
- ✅ Updates incomplete fields

## Performance

- **Speed**: ~300ms per game (BGG rate limit)
- **Batch size**: Processes entire library at once
- **Memory**: Minimal (streams API responses)
- **Network**: ~10-50KB per game

### Estimated Times

| Games to Enrich | Time Required |
|-----------------|---------------|
| 10 games        | ~3 seconds    |
| 50 games        | ~15 seconds   |
| 100 games       | ~30 seconds   |
| 200 games       | ~60 seconds   |

## Troubleshooting

### No "Enrich Descriptions" Button

**Cause**: All games already have good descriptions
**Solution**: Check individual games - they may already be complete

### Enrichment Fails Immediately

**Cause**: Network error or API down
**Solution**: 
1. Check internet connection
2. Try again in a few minutes
3. Use browser console script as fallback

### Some Games Fail to Enrich

**Cause**: BGG API may not have data for that game
**Solution**: 
- Check the game exists on BGG
- Verify the BGG ID is correct
- Some games may genuinely lack descriptions

### Enrichment Takes Too Long

**Cause**: Large library + BGG rate limits
**Solution**:
- Be patient (rate limits are necessary)
- Process runs in background
- You can close tab and check back later

### Changes Don't Appear

**Cause**: Browser cache
**Solution**: Hard refresh (`Cmd+Shift+R` or `Ctrl+Shift+R`)

## Future Improvements

Potential enhancements:

- [ ] Automatic background enrichment
- [ ] Progressive enrichment (top games first)
- [ ] Enrichment scheduling (during idle time)
- [ ] Multi-source enrichment (BGG + others)
- [ ] User-controlled enrichment settings
- [ ] Enrichment quality scores
- [ ] Historical data tracking

## API Rate Limits

To be respectful of BGG's API:

- ✅ 300ms delay between requests
- ✅ User-Agent header included
- ✅ Caching to minimize requests
- ✅ Error handling with exponential backoff

## Data Quality

The enrichment system ensures:

- ✅ **Complete descriptions** - Full BGG text
- ✅ **Clean HTML** - Properly decoded entities
- ✅ **Accurate metadata** - Direct from BGG
- ✅ **No duplicates** - Merges intelligently
- ✅ **Preserves custom data** - Won't overwrite user edits

## Examples

### Before Enrichment

```json
{
  "id": "bgg-174430",
  "bggId": 174430,
  "name": "Gloomhaven",
  "description": "Gloomhaven is a game of...", // Truncated at 200 chars
  "rating": 8.9
}
```

### After Enrichment

```json
{
  "id": "bgg-174430",
  "bggId": 174430,
  "name": "Gloomhaven",
  "description": "Gloomhaven is a game of Euro-inspired tactical combat in a persistent world of shifting motives. Players will take on the role of a wandering adventurer with their own special set of skills and their own reasons for travelling to this dark corner of the world. Players must work together out of necessity to clear out menacing dungeons and forgotten ruins. In the process, they will enhance their abilities with experience and loot, discover new locations to explore and plunder, and expand an ever-branching story fueled by the decisions they make...", // Full description
  "rating": 8.9,
  "complexity": 3.86,
  "categories": ["Adventure", "Exploration", "Fantasy", "Fighting", "Miniatures"],
  "mechanics": ["Action Queue", "Campaign / Battle Card Driven", "Card Play Conflict Resolution"],
  "image": "https://cf.geekdo-images.com/...",
  "minPlayers": 1,
  "maxPlayers": 4,
  "playingTime": 120
}
```

## Related Files

- `app/api/library/enrich/route.ts` - Enrichment API endpoint
- `app/api/bgg/game/[id]/route.ts` - BGG game fetching (updated to not truncate)
- `lib/storage.ts` - Storage functions for enrichment
- `lib/store/gameStore.ts` - Store actions for enrichment
- `app/(main)/library/page.tsx` - UI with enrichment button
- `scripts/enrich-library.js` - Standalone enrichment script

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your internet connection
3. Try the manual script method
4. Report issues on GitHub

---

**Last Updated**: January 2026
**Version**: 1.0.0
