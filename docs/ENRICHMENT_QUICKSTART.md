# Library Enrichment - Quick Start Guide

## What is Library Enrichment?

Library Enrichment automatically fills in missing or incomplete game descriptions and metadata from BoardGameGeek for all games in your collection.

## When Do You Need It?

You need enrichment when:
- ✅ Games show short or truncated descriptions
- ✅ Games are missing images or metadata
- ✅ Games were added before the full BGG integration
- ✅ You imported games from another source

## How to Enrich Your Library

### Option 1: Use the UI Button (Easiest)

1. Go to your **Game Library** page
2. Look for the orange **"Enrich Descriptions (X)"** button at the top
3. Click it to start automatic enrichment
4. Wait for completion (shows success message)
5. Refresh the page to see updated descriptions

### Option 2: Browser Console Script

If the button doesn't appear or isn't working:

1. Open browser console (`F12` or `Cmd+Opt+J`)
2. Paste this code:

```javascript
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
  console.log('✅ Enriched:', data.stats);
  location.reload();
});
```

3. Press Enter and wait for completion

## What Gets Updated?

The enrichment process updates:
- 📝 **Full Descriptions** - Complete BGG descriptions (no truncation)
- 🖼️ **Images** - High-quality cover art
- 👥 **Player Counts** - Min/max players
- ⏱️ **Play Times** - Duration information
- 🎲 **Ratings & Complexity** - BGG scores
- 🏷️ **Categories & Mechanics** - Game classifications

## How Long Does It Take?

| Games to Enrich | Time Required |
|-----------------|---------------|
| 10 games        | ~3 seconds    |
| 50 games        | ~15 seconds   |
| 100 games       | ~30 seconds   |

## Troubleshooting

**No button appears?** 
→ All your games already have complete descriptions! 🎉

**Enrichment fails?**
→ Check internet connection and try again

**Changes don't show?**
→ Hard refresh the page (`Cmd+Shift+R` or `Ctrl+Shift+R`)

## Important Notes

- ⚠️ Only works for games with BGG IDs (from BGG search)
- ⚠️ Won't overwrite existing good data
- ⚠️ Respects BGG API rate limits (300ms per game)
- ⚠️ Custom games without BGG IDs can't be enriched

## See Also

- Full documentation: `docs/LIBRARY_ENRICHMENT.md`
- Script location: `scripts/enrich-library.js`

---

Need help? Check the browser console for detailed logs during enrichment.
