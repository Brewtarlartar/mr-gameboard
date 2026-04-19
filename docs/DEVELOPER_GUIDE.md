# 🎮 Mr. GameBoard - Developer Guide

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Mr. GameBoard/
├── app/
│   ├── (main)/              # Main app layout with navigation
│   │   ├── page.tsx         # Homepage with wizard & dashboard
│   │   ├── library/         # Game library & collection
│   │   │   └── page.tsx     # Netflix-style browsing
│   │   ├── play/            # Play mode & game assistant
│   │   │   └── page.tsx     # Guided play experience
│   │   └── layout.tsx       # Navigation & achievement system
│   ├── api/
│   │   ├── chat/            # Gemini AI chatbot endpoint
│   │   ├── bgg/             # BoardGameGeek integration
│   │   └── tts/             # Text-to-speech (ElevenLabs)
│   ├── layout.tsx           # Root layout with PWA meta
│   └── globals.css          # Global styles & utilities
├── components/
│   ├── analytics/           # Play tracking & insights
│   │   ├── PlayHistory.tsx
│   │   ├── InsightsDashboard.tsx
│   │   └── LogSessionModal.tsx
│   ├── dashboard/           # Homepage widgets
│   │   ├── StatsWidget.tsx
│   │   ├── RecentActivity.tsx
│   │   └── FeaturedGames.tsx
│   ├── library/             # Game library components
│   │   ├── GameCard.tsx
│   │   ├── GameDetail.tsx
│   │   ├── GameSearch.tsx
│   │   ├── CategoryScroller.tsx  # Netflix-style
│   │   ├── LibraryFilters.tsx
│   │   ├── Recommendations.tsx
│   │   ├── DiscoverGames.tsx
│   │   └── Wishlist.tsx
│   ├── wizard/              # AI wizard components
│   │   ├── WizardCharacter.tsx
│   │   └── WizardChat.tsx
│   ├── crystal-ball/        # Game recommendation feature
│   │   └── CrystalBall.tsx
│   ├── gamification/        # Achievement system
│   │   └── AchievementSystem.tsx
│   ├── subscription/        # Freemium/Pro features
│   │   ├── PaywallModal.tsx
│   │   └── ProBadge.tsx
│   └── layout/
│       └── Footer.tsx
├── lib/
│   ├── store/               # Zustand state management
│   │   ├── gameStore.ts     # Main game library store
│   │   ├── achievementStore.ts
│   │   ├── playHistoryStore.ts
│   │   └── wishlistStore.ts
│   ├── seedData/            # Initial game data
│   └── voice.ts             # TTS/STT utilities
├── types/
│   ├── game.ts              # Game type definitions
│   └── seedGame.ts
├── public/
│   └── manifest.json        # PWA configuration
└── tailwind.config.ts       # Design system configuration
```

---

## 🎨 Design System

### Color Palette

```typescript
// Primary Colors (Gaming)
cyan-500 (#06b6d4)      // Primary actions, highlights
purple-500 (#8b5cf6)    // Secondary, magical elements
gold-400 (#fbbf24)      // Achievements, premium

// Semantic Colors
slate-900 (#0f172a)     // Dark background
slate-800 (#1e293b)     // Card backgrounds
slate-700 (#334155)     // Borders

// Gradients
from-cyan-400 to-purple-400      // Primary gradient
from-gold-500 to-gold-600        // Premium gradient
```

### Typography

```css
/* Fonts */
font-sans: 'Inter'           /* Body text */
font-display: 'Montserrat'   /* Headings */

/* Text Styles */
.gradient-text               /* Animated gradient text */
.text-glow                   /* Glowing text effect */
```

### Components

```css
/* Glass Cards */
.glass-card                  /* Subtle glassmorphism */
.glass-card-dark             /* Darker glass variant */

/* Buttons */
.btn-premium                 /* Primary CTA button */
.btn-gaming                  /* Secondary gaming button */

/* Animations */
.animate-gradient            /* Gradient shift animation */
.animate-glass-float         /* Subtle floating effect */
.animate-shimmer             /* Shimmer loading effect */
```

---

## 🔧 State Management (Zustand)

### gameStore.ts
**Purpose:** Main game library, favorites, discover, chat

```typescript
import { useGameStore } from '@/lib/store/gameStore';

const {
  games,              // All games in library
  favorites,          // Favorite game IDs
  isProMember,        // Pro membership status
  addGame,            // Add game to library
  toggleFavorite,     // Toggle favorite status
  addChatMessage,     // Add wizard chat message
} = useGameStore();
```

### achievementStore.ts
**Purpose:** Gamification, achievements, XP, levels

```typescript
import { useAchievementStore } from '@/lib/store/achievementStore';

const {
  achievements,       // All achievement definitions
  unlockedIds,        // Unlocked achievement IDs
  xp,                 // Current XP
  level,              // Current level
  checkAchievements,  // Check & unlock achievements
} = useAchievementStore();
```

### playHistoryStore.ts
**Purpose:** Play session tracking, analytics

```typescript
import { usePlayHistoryStore } from '@/lib/store/playHistoryStore';

const {
  sessions,           // All play sessions
  addSession,         // Log new session
  getTotalPlayTime,   // Get total minutes played
  getMostPlayedGames, // Get top games by play count
} = usePlayHistoryStore();
```

### wishlistStore.ts
**Purpose:** Wishlist management

```typescript
import { useWishlistStore } from '@/lib/store/wishlistStore';

const {
  wishlist,           // All wishlist items
  addToWishlist,      // Add game to wishlist
  isInWishlist,       // Check if game in wishlist
} = useWishlistStore();
```

---

## 🎯 Key Features

### 1. Netflix-Style Library

Located in: `app/(main)/library/page.tsx`

**How it works:**
- Horizontal scrolling categories (My Collection, Favorites, Quick Games, etc.)
- Advanced filter sidebar (player count, time, complexity, genres)
- Real-time filtering with `CategoryScroller` component
- Smooth animations with Framer Motion

**To add new category:**
```tsx
<CategoryScroller
  title="New Category"
  games={filteredGames}
  onGameSelect={handleGameSelect}
  onToggleFavorite={handleToggleFavorite}
  favorites={favorites}
/>
```

---

### 2. Achievement System

Located in: `components/gamification/AchievementSystem.tsx`

**14 Achievements across 5 categories:**
- Collector (library size)
- Explorer (discover usage)
- Social (play sessions)
- Strategist (wizard usage)
- Completionist (meta achievements)

**Auto-tracking:**
- Achievements check on every game library change
- XP awarded on unlock
- Level up every 100 XP
- Persistent storage

**To add new achievement:**
```typescript
// In lib/store/achievementStore.ts
{
  id: 'my-achievement',
  title: 'Achievement Name',
  description: 'Do something cool',
  icon: '🏆',
  rarity: 'epic',
  category: 'collector',
  xp: 50,
  condition: (data) => data.gameCount >= 50
}
```

---

### 3. Play Tracking

Located in: `components/analytics/`

**Features:**
- Session logging with players, scores, winners
- Personal ratings (1-5 stars)
- Session notes
- Heat map calendar (last 30 days)
- H-Index calculation
- Most played games ranking

**Usage:**
```typescript
const { addSession } = usePlayHistoryStore();

addSession({
  gameId: game.id,
  gameName: game.name,
  date: new Date(),
  duration: 90,  // minutes
  players: [
    { name: 'Alice', score: 45, isWinner: true },
    { name: 'Bob', score: 32, isWinner: false },
  ],
  rating: 5,
  notes: 'Epic game!',
});
```

---

### 4. PWA Support

Located in: `public/manifest.json`, `app/layout.tsx`

**Features:**
- Installable to home screen
- Offline-ready (foundation)
- Custom splash screen
- Shortcuts to Library & Play Mode

**To test:**
1. Run `npm run build && npm start`
2. Open in Chrome
3. Click "Install App" icon in address bar
4. App appears on home screen

---

### 5. Freemium Model

Located in: `components/subscription/PaywallModal.tsx`

**Plans:**
- Free: Core features
- Pro: $4.99/mo or $49/year (18% savings)

**Pro Features:**
- Unlimited AI messages
- Advanced analytics
- All achievements
- Strategy library
- Cloud sync
- Export data
- Ad-free
- Priority support

**Usage:**
```typescript
import PaywallModal from '@/components/subscription/PaywallModal';

const [showPaywall, setShowPaywall] = useState(false);

// Check if user is Pro
if (!isProMember) {
  setShowPaywall(true);
}

<PaywallModal
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  feature="Advanced Analytics"
/>
```

---

## 🔌 API Integration

### Gemini AI (Google)

Located in: `app/api/chat/route.ts`

**Environment variable:**
```env
GEMINI_API_KEY=your_key_here
```

**Usage:**
- Powers the AI Wizard chat
- Context-aware responses
- Game recommendations
- Strategy advice

---

### BoardGameGeek API

Located in: `app/api/bgg/`

**Endpoints:**
- `/api/bgg/search?q=catan` - Search games
- `/api/bgg/game/[id]` - Get game details
- `/api/bgg/top500` - Top rated games

**No API key required** (public API)

---

### ElevenLabs TTS

Located in: `lib/voice.ts`, `app/api/tts/route.ts`

**Environment variable:**
```env
ELEVENLABS_API_KEY=your_key_here
```

**Usage:**
- Wizard voice
- Text-to-speech for chat messages

---

## 🧪 Testing

### Manual Testing Checklist

**Homepage:**
- [ ] Wizard animates on load
- [ ] Stats show correct game count
- [ ] Featured games carousel works
- [ ] Recent activity displays

**Library:**
- [ ] Categories scroll horizontally
- [ ] Filters work in real-time
- [ ] Search finds games
- [ ] Game detail modal opens
- [ ] Add/remove favorites

**Achievements:**
- [ ] Achievement panel opens
- [ ] Unlock notification shows
- [ ] XP and level display
- [ ] Progress bars animate

**Play Tracking:**
- [ ] Log session modal opens
- [ ] Session saves correctly
- [ ] Analytics update
- [ ] Heat map shows activity

**Wishlist:**
- [ ] Add to wishlist
- [ ] Priority changes
- [ ] Quick add to library
- [ ] Remove from wishlist

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `ELEVENLABS_API_KEY`
4. Deploy!

### Environment Variables

```env
# Required
GEMINI_API_KEY=your_google_gemini_key

# Optional (for TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key
```

---

## 📦 Dependencies

```json
{
  "@google/generative-ai": "^0.x",  // Gemini AI
  "framer-motion": "^11.x",          // Animations
  "lucide-react": "^0.x",            // Icons
  "next": "15.x",                     // Framework
  "react": "^19.x",
  "zustand": "^5.x",                  // State management
  "date-fns": "^4.x",                 // Date formatting
  "tailwindcss": "^4.x"               // Styling
}
```

---

## 🎓 Best Practices

### Adding New Components

1. Use TypeScript for type safety
2. Follow existing naming conventions
3. Use `glass-card` for containers
4. Add Framer Motion for animations
5. Make responsive (mobile-first)

### State Management

1. Use Zustand stores for global state
2. Persist important data with `persist` middleware
3. Keep stores focused (single responsibility)
4. Use TypeScript interfaces

### Styling

1. Use Tailwind utility classes
2. Use design system colors/fonts
3. Add hover/focus states
4. Use `animate-*` for motion
5. Test on mobile

---

## 🐛 Common Issues

### "ReferenceError: window is not defined"
**Solution:** Use `'use client'` directive at top of file

### Images not loading
**Solution:** Check CORS, use BGG's CDN for board game images

### Achievements not unlocking
**Solution:** Check `checkAchievements()` is called in `gameStore` when games change

### PWA not installing
**Solution:** Must be served over HTTPS (works in production, not always locally)

---

## 📈 Performance Tips

1. **Lazy load images:** Use `loading="lazy"` on `<img>` tags
2. **Virtualize long lists:** For 1000+ games, use `react-window`
3. **Memoize expensive calculations:** Use `useMemo` for filters
4. **Code split routes:** Next.js does this automatically
5. **Optimize Tailwind:** PurgeCSS removes unused styles in production

---

## 🎯 Roadmap (Remaining 50%)

1. **Streamer Tools** - OBS overlays
2. **Social Sharing** - Collection cards
3. **Game Night Planner** - Event management
4. **Wizard Enhancements** - Context memory
5. **Strategy Library** - Searchable database
6. **Play Mode V2** - In-game assistant
7. **Discovery V2** - Interactive explorer
8. **Mobile Redesign** - Bottom nav, gestures
9. **Database Migration** - Supabase + Auth
10. **Testing Suite** - Jest + Playwright

---

## 💬 Support

**Issues?** Check the code comments or README files
**Questions?** All components are documented inline
**Contributing?** Follow the style guide above

---

**Built with ❤️ for board game enthusiasts**
**Version:** 2.0.0 (50% Complete)
**Last Updated:** ${new Date().toLocaleDateString()}

