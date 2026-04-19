# How to Re-Add 7 Wonders to Your Library

## The Problem

You removed 7 Wonders and now can't find it when searching. This is because there are **TWO different search bars** on the Library page that look similar but do different things!

## The Solution - Step by Step

### To Re-Add 7 Wonders:

1. **Scroll down** past the first search bar you see at the top
2. Look for a larger, more prominent search bar that says:
   **"Search BoardGameGeek for games to add..."**
3. Click in that search bar
4. Type **"7 wonders"**
5. Wait for results to appear (dropdown with games)
6. Click **"7 Wonders"** in the results
7. The game will be automatically added back with **FULL description**!

## Understanding the Two Search Bars

### Search Bar #1 - Filter Bar (At the very top)
- **What it does:** Filters games ALREADY in your library
- **Placeholder text:** Just a search icon, no specific text
- **Location:** Very top of the page
- **Purpose:** Quick filter to find games you own
- **❌ Won't find 7 Wonders** - Because it's not in your library anymore!

### Search Bar #2 - Add Games Search (Below buttons)
- **What it does:** Searches BoardGameGeek to ADD new games
- **Placeholder text:** "Search BoardGameGeek for games to add..."
- **Location:** Below the "Scan Shelf", "Share", "Compare" buttons
- **Purpose:** Add new games from BGG database
- **✅ WILL find 7 Wonders** - Searches all games on BGG!

## Visual Guide

```
┌─────────────────────────────────────────┐
│  🎮 Game Library                         │
│  Your personal Netflix-style collection  │
│                                          │
│  [Scan] [Share] [Compare] [Custom Game] │ ← Buttons
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🔍 Search BoardGameGeek...        │ │ ← USE THIS ONE!
│  └────────────────────────────────────┘ │    (Adds games)
│                                          │
│  [Game Cards showing your collection]   │
└─────────────────────────────────────────┘
```

## Alternative Methods to Re-Add 7 Wonders

### Method 1: Use Discover Tab (Easiest)
1. Click **"Discover"** in the navigation
2. Click **"Strategy Games"** to expand
3. Scroll to find **"7 Wonders"** (Rank #68)
4. Click the card
5. Click **"Add to Collection"**
6. Done! ✅

### Method 2: Use Recommendations (If visible)
1. Scroll down on Library page
2. Look for "Recommendations" section
3. If you see 7 Wonders there, click it
4. Click **"Add to Library"**

### Method 3: Browser Console (Advanced)
Open browser console (F12) and paste:

```javascript
// Add 7 Wonders directly
fetch('/api/bgg/game/68448')
  .then(r => r.json())
  .then(data => {
    const library = JSON.parse(localStorage.getItem('mr-boardgame-library') || '[]');
    library.push(data.game);
    localStorage.setItem('mr-boardgame-library', JSON.stringify(library));
    location.reload();
  });
```

## Why This Happened

When you removed 7 Wonders, it was deleted from your library's localStorage. The filter search at the top **only** searches what's currently in your library, so it can't find games you've removed.

The GameSearch component (the second search bar) searches BGG's entire database, so it CAN find any game including ones not in your library.

## Preventing Future Confusion

### Tips:
1. **Use Filter Search** for finding games you already own
2. **Use BGG Search** for adding new games
3. **Bookmark common games** as favorites (❤️) so they're easy to find
4. **Check Discover tab** when browsing new games

### UI Improvement Suggestion

The two search bars should be more visually distinct! Here's what would help:
- Filter search could say: "Filter your library..."
- Add search (current) says: "Search BoardGameGeek for games to add..."
- Different colors or icons to distinguish them

## What Now?

### Your Best Options:
1. **Easiest**: Go to Discover → Strategy → Find 7 Wonders → Add
2. **Fastest**: Use the GameSearch bar (scroll down to find it)
3. **Most Direct**: Use browser console method above

Once re-added, 7 Wonders will have:
- ✅ Full description (2000+ characters)
- ✅ All categories and mechanics
- ✅ Complete BGG data
- ✅ Auto-enrichment when you view details

---

**Bottom Line**: There are TWO search bars. You were using the filter (top). Use the BGG search (below buttons) or go to Discover tab!
