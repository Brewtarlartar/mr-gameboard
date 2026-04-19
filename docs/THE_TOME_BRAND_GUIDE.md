# 🎨 The Tome - Brand Guidelines

## Visual Identity

**The Tome** represents the convergence of all board game knowledge into one comprehensive source. The visual identity reflects this through:

### Brand Colors

#### Primary Palette
- **Tome Purple** `#8b5cf6` - Mystical knowledge and wisdom
- **Tome Purple Light** `#a855f7` - Highlighted elements
- **Tome Amber** `#f59e0b` - Warmth and accessibility
- **Tome Amber Light** `#fbbf24` - Accents and highlights

#### Secondary Palette (Tavern Theme)
- **Parchment** `#f4e4bc` - Primary text
- **Gold** `#d4a574` - Secondary accents
- **Flame** `#ff8c42` - Interactive elements
- **Dark Background** `#0d0c0f` - Primary background

### Logo

The Tome logo features:
- An ancient book icon with mystical aura
- Purple-to-amber gradient effect
- Glowing background for emphasis
- Clean, legible typography

SVG implementation:
```svg
<svg viewBox="0 0 24 24" fill="none">
  <path d="M4 4h16v16H4z" fill="url(#tome-gradient)" stroke="#f59e0b" stroke-width="1.5"/>
  <path d="M7 8h10M7 12h10M7 16h7" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M6 4v16" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="12" cy="12" r="2" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.6"/>
  <defs>
    <linearGradient id="tome-gradient" x1="4" y1="4" x2="20" y2="20">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
</svg>
```

### Typography

**Display Font (Headings):** Cinzel
- Used for: Main headings, titles, logo text
- Weights: 400, 600, 700, 900
- Character: Medieval, authoritative, timeless

**Body Font (Content):** Lora
- Used for: Paragraphs, descriptions, longer text
- Weights: 400, 500, 600, 700
- Character: Readable, elegant, warm

**UI Font (Interface):** Fira Sans
- Used for: Buttons, labels, navigation
- Weights: 400, 500, 600, 700
- Character: Modern, clean, functional

### Visual Effects

#### Gradient Text
```css
.gradient-text-tome {
  background: linear-gradient(to right, #a855f7, #fbbf24, #a855f7);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: gradient-shift 4s linear infinite;
}
```

#### Glow Effects
```css
/* Standard Glow */
.tome-glow {
  box-shadow: 
    0 0 20px rgba(139, 92, 246, 0.3),
    0 0 40px rgba(245, 158, 11, 0.2);
}

/* Strong Glow (for emphasis) */
.tome-glow-strong {
  box-shadow: 
    0 0 30px rgba(139, 92, 246, 0.5),
    0 0 60px rgba(245, 158, 11, 0.3),
    0 0 90px rgba(139, 92, 246, 0.2);
}
```

## Brand Voice

### Personality
- **Wise** - Like an ancient keeper of knowledge
- **Welcoming** - Accessible to all skill levels
- **Mystical** - Touch of magic and wonder
- **Helpful** - Always focused on user success

### Messaging

#### Taglines
- "Your Comprehensive Board Game Knowledge Companion"
- "Where Board Game Knowledge Lives"
- "All Board Game Wisdom in One Tome"

#### Welcome Messages
- "Welcome to The Tome! Knowledge awaits within these pages."
- "The ancient pages of The Tome reveal themselves to you."
- "The Tome's magic stirs... Your gaming journey continues."

#### Feature Descriptions
Always emphasize:
1. Comprehensiveness - "All in one place"
2. Knowledge - "Wisdom", "insights", "mastery"
3. Accessibility - "Easy", "guided", "step-by-step"
4. Magic - "Mystical", "enchanted", "revealed"

## UI Components

### Navigation Bar
- Logo + animated text on left
- Subtle shadow with purple/amber glow
- Transparent background with backdrop blur
- Border with gold/purple accent

### Cards
- Parchment-style background
- Purple/amber border
- Subtle hover effects with glow
- Icon with gradient background

### Buttons
- Primary: Purple to amber gradient
- Secondary: Outlined with glow effect
- Hover: Increased glow intensity
- Active: Slight scale effect

### Modal/Popups
- Dark background with strong backdrop blur
- Purple border with glow
- Animated entrance (fade + scale)
- Close button with amber accent

## Animation Guidelines

### Timing
- Entrances: 0.3-0.6s
- Hover effects: 0.2s
- Complex animations: 2-4s loops

### Easing
- Entrances: ease-out
- Exits: ease-in
- Continuous: linear or ease-in-out

### Special Effects
- **Glow pulsing:** 2-3s cycle
- **Gradient shift:** 4s continuous
- **Particle effects:** Slow, subtle movement
- **Sparkles:** Random delays, 3s cycles

## Iconography

### Primary Icon Set
Using Lucide React icons:
- Library: `BookOpen`
- Play: `Play`
- Strategy: `Target`
- Analytics: `BarChart3`
- Wisdom/Magic: `Sparkles`
- Discovery: `Compass`
- Profile: `User`

### Custom Icons
- Tome logo (custom SVG)
- Wizard character (custom illustration)
- Crystal ball (custom component)

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Larger touch targets (44px minimum)
- Bottom navigation bar
- Simplified gradients (performance)
- Reduced animation complexity

### Performance
- Lazy load components
- Optimize images and SVGs
- Use CSS transforms for animations
- Minimize glow effects on mobile

## Accessibility

### Color Contrast
- Text on dark: AAA standard (7:1)
- Interactive elements: AA standard (4.5:1)
- Gradient text: High contrast background

### Interactive Elements
- Keyboard navigation support
- Focus indicators visible
- ARIA labels on custom components
- Screen reader friendly

### Motion
- Respect `prefers-reduced-motion`
- Disable complex animations for accessibility
- Provide static alternatives

## Usage Examples

### Page Header
```tsx
<TomeLogo size="lg" showText={true} animated={true} />
<h1 className="gradient-text-tome">Welcome to The Tome</h1>
<p className="text-tavern-text-muted">Your knowledge awaits</p>
```

### Feature Card
```tsx
<div className="card-parchment tome-glow p-6 hover:tome-glow-strong transition-all">
  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-amber-500">
    <Icon className="w-6 h-6 text-white" />
  </div>
  <h3 className="text-lg font-display font-bold text-tavern-text-primary">
    Feature Title
  </h3>
</div>
```

### Wizard Message
```tsx
<div className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/30 rounded-lg p-4">
  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
  <p className="font-body text-tavern-text-primary">
    The Tome reveals: [wisdom here]
  </p>
</div>
```

## Brand Don'ts

❌ Don't use other color schemes
❌ Don't modify the logo proportions
❌ Don't use competing book/knowledge metaphors
❌ Don't use overly technical language
❌ Don't diminish the "comprehensive" messaging
❌ Don't refer to old "Mr. Board Game" branding

## Brand Dos

✅ Emphasize knowledge and wisdom
✅ Use mystical, welcoming language
✅ Maintain purple/amber color harmony
✅ Keep animations smooth and purposeful
✅ Focus on user empowerment
✅ Celebrate the board gaming community

---

*The Tome - Where All Board Game Knowledge Lives* 📖✨
