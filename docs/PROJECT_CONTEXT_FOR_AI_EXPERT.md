# Mr. Board Game - Project Context for AI Expert

> **Security Note:** API keys have been replaced with `YOUR_API_KEY_HERE`

---

## 1. Tech Stack Overview

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2 (App Router) |
| **Language** | TypeScript 5.3 |
| **UI Library** | React 18.3 |
| **Styling** | Tailwind CSS 3.4 |
| **Animation** | Framer Motion 11.0 |
| **Icons** | Lucide React |
| **State Management** | Zustand 4.5 |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai` v0.21) |
| **HTTP Client** | Axios 1.6 |

---

## 2. File Structure

```
Mr. GameBoard/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home page with wizard
│   │   ├── library/
│   │   │   └── page.tsx          # Game library page
│   │   └── play/
│   │       └── page.tsx          # Play mode page
│   ├── api/
│   │   ├── bgg/
│   │   │   ├── game/[id]/route.ts
│   │   │   └── search/route.ts
│   │   ├── chat/
│   │   │   └── route.ts          # ⭐ AI Chat API endpoint
│   │   ├── crystal-ball/
│   │   │   └── route.ts
│   │   ├── games/recommendations/route.ts
│   │   └── play/guide/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── crystal-ball/
│   │   └── CrystalBall.tsx
│   ├── library/
│   │   ├── CustomGameForm.tsx
│   │   ├── GameCard.tsx
│   │   ├── GameDetail.tsx
│   │   ├── GameSearch.tsx
│   │   └── Recommendations.tsx
│   ├── play-mode/
│   │   ├── DiceRoller.tsx
│   │   ├── GameSelector.tsx
│   │   ├── GameUtilities.tsx
│   │   ├── PlayerSetup.tsx
│   │   ├── PracticeRound.tsx
│   │   ├── ScoreTracker.tsx
│   │   ├── SetupGuide.tsx
│   │   └── TurnTimer.tsx
│   └── wizard/
│       ├── WizardCharacter.tsx
│       └── WizardChat.tsx        # ⭐ Chat UI with Quick Actions
├── lib/
│   ├── bgg.ts                    # BoardGameGeek API client
│   ├── gemini.ts                 # ⭐ Gemini AI configuration
│   ├── openai.ts                 # (Legacy - not used)
│   ├── storage.ts                # LocalStorage wrapper
│   ├── store/
│   │   └── gameStore.ts          # ⭐ Zustand state management
│   └── utils.ts
├── types/
│   └── game.ts                   # TypeScript interfaces
├── .env.local                    # ⭐ API key stored here
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Key Code Content

### 3.1 Gemini AI Configuration (`lib/gemini.ts`)

This file initializes the Google Generative AI SDK and contains the system prompts for different personas.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Game } from '@/types/game';

// Get API key from environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set in .env.local as: GEMINI_API_KEY=YOUR_API_KEY_HERE

// Initialize the Google Generative AI client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface ChatContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  gameLibrary?: Game[];
  currentGame?: Game;
}

const SYSTEM_PROMPT = `You are a board game companion AI that adopts different personas based on the user's needs. Detect the role from the message and respond accordingly:

---
**[ROLE: High Arbiter of Rules]** - SETTLE DISPUTES
You are a neutral, unbiased judge. You do NOT take sides.
Instructions:
1. Ask players to briefly describe the disputed situation
2. Once explained, CITE the specific rule from the game manual (page number if known)
3. Give a DEFINITIVE, FINAL ruling - no ambiguity
4. Be firm but fair. Your ruling is final.
Example: "According to Catan rules (page 8), trading IS permitted after rolling the dice. RULING: The trade is valid."

---
**[ROLE: Battle Tactician Alaric]** - STRATEGY
You analyze the battlefield and provide tactical options.
Instructions:
1. First, ask about current game situation (resources, position, threats)
2. Analyze using Chain of Thought: "Given X resources and Y position..."
3. Provide exactly 3 OPTIONS:
   - 🔴 AGGRESSIVE: High risk, high reward move
   - 🔵 DEFENSIVE: Secure/protect current position
   - 🟡 TRICKY: Unexpected maneuver to surprise opponents
4. RECOMMEND the best option with a short, punchy reason
Example: "RECOMMENDATION: Go AGGRESSIVE. You have resource advantage - strike now before they recover."

---
**[ROLE: Keeper of the Tome]** - RULES HELP
You are a search engine for rules, NOT creative mode.
Instructions:
1. Ask which specific rule confuses them
2. QUOTE the rule exactly as written in the manual
3. Provide a SIMPLIFIED version in plain language
4. If you don't know the exact rule, ADMIT IT immediately - do NOT guess
Example: "RULE (Ticket to Ride, p.5): 'A player may claim any open route on the board.' SIMPLIFIED: You can claim any route that no one else has taken yet."

---
**[ROLE: Grand Librarian of Games]** - RECOMMENDATIONS
You recommend hidden gem games, not just popular ones.
Instructions:
1. Ask what games they've enjoyed or what "vibe" they want (co-op, betrayal, strategy, party)
2. Based on their answer, suggest 3 HIDDEN GEMS - avoid obvious popular choices
3. For each game: Name, player count, playtime, and ONE sentence on why it matches their vibe
Example: "Based on your love of betrayal games, try: 1) Dead of Winter (3-5p, 90min) - zombie survival with a traitor mechanic..."

---
If no role is specified, ask the user what kind of help they need. Always be specific and actionable.`;

/**
 * Send a chat message to the Gemini AI and receive a response.
 * @param userMessage - The user's message to send
 * @returns The AI's response as a string
 */
export async function SendChatMessage(userMessage: string): Promise<string> {
  if (!genAI || !GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  try {
    // Use gemini-1.5-flash model (fast and capable)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create the prompt with system context
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nWizard:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error: unknown) {
    console.error('Gemini API error:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
    throw new Error('Failed to get AI response: Unknown error');
  }
}

/**
 * Chat with the wizard with full context
 */
export async function chatWithWizard(
  message: string,
  context: ChatContext
): Promise<string> {
  if (!genAI || !GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation with context
    let fullPrompt = SYSTEM_PROMPT + '\n\n';

    // Add game library context if available
    if (context.gameLibrary && context.gameLibrary.length > 0) {
      fullPrompt += `User's game library includes: ${context.gameLibrary
        .map(g => g.name)
        .join(', ')}\n\n`;
    }

    // Add previous messages for context
    for (const msg of context.messages) {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Wizard'}: ${msg.content}\n\n`;
    }

    // Add current message
    fullPrompt += `User: ${message}\n\nWizard:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    console.error('Gemini chat error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to communicate with the wizard: ${error.message}`);
    }
    throw new Error('Failed to communicate with the wizard');
  }
}

/**
 * Generate a game recommendation based on player count and library
 */
export async function generateGameRecommendation(
  playerCount: number,
  gameLibrary: Game[]
): Promise<string> {
  if (!genAI || !GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const libraryInfo = gameLibrary.length > 0
      ? `Their current library includes: ${gameLibrary.map(g => g.name).join(', ')}. `
      : '';

    const prompt = `${SYSTEM_PROMPT}

Recommend a board game for ${playerCount} players. ${libraryInfo}
Consider their existing games and suggest something that would complement their collection or offer something different. 
Provide the game name, brief description, and why it's a good fit. Keep response concise (2-3 paragraphs max).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    console.error('Recommendation error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate recommendation: ${error.message}`);
    }
    throw new Error('Failed to generate recommendation');
  }
}

/**
 * Generate a play guide for a game with player setup
 */
export async function generatePlayGuide(
  game: Game,
  players: Array<{ name: string; role?: string; [key: string]: unknown }>
): Promise<{ setup: string[]; practiceRound: string[] }> {
  if (!genAI || !GEMINI_API_KEY) {
    return {
      setup: ['Setup guide requires AI. Please check your GEMINI_API_KEY.'],
      practiceRound: ['Practice round requires AI. Please check your GEMINI_API_KEY.'],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const playerInfo = players.map(p => {
      const attrs = Object.entries(p)
        .filter(([key]) => key !== 'name' && key !== 'id')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${p.name}${attrs ? ` (${attrs})` : ''}`;
    }).join('\n');

    const prompt = `${SYSTEM_PROMPT}

Create a play guide for "${game.name}".

Players:
${playerInfo}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation, just the JSON):
{"setup": ["step 1", "step 2", "step 3", "step 4", "step 5"], "practiceRound": ["turn 1 instruction", "turn 2 instruction", "turn 3 instruction", "turn 4 instruction", "turn 5 instruction"]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        setup: parsed.setup || [],
        practiceRound: parsed.practiceRound || [],
      };
    }

    throw new Error('Could not parse response');
  } catch (error) {
    console.error('Play guide error:', error);
    return {
      setup: ['Setup guide generation failed. Please refer to the rulebook.'],
      practiceRound: ['Practice round guide generation failed. Please refer to the rulebook.'],
    };
  }
}
```

---

### 3.2 Chat API Route (`app/api/chat/route.ts`)

This is the Next.js API endpoint that receives chat requests from the frontend.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { chatWithWizard } from '@/lib/gemini';
import { Game } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, gameLibrary = [], chatHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const context = {
      messages: chatHistory,
      gameLibrary: gameLibrary as Game[],
    };

    const response = await chatWithWizard(message, context);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
```

---

### 3.3 Chat UI Component (`components/wizard/WizardChat.tsx`)

This component handles the chat interface, Quick Action buttons, and game state context tracking.

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Gamepad2, Users, BookOpen, Target, Loader2, AlertCircle, X } from 'lucide-react';
import { useGameStore } from '@/lib/store/gameStore';
import { ChatMessage } from '@/types/game';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

// Quick Action button definitions with role-specific prompts
const quickActions: QuickAction[] = [
  {
    id: 'recommend',
    label: 'Recommend',
    icon: <Gamepad2 className="w-4 h-4" />,
    prompt: '[ROLE: Grand Librarian of Games] I am looking for a new board game to play. Please ask me about games I have enjoyed or what vibe I am looking for.',
  },
  {
    id: 'settle',
    label: 'Settle Dispute',
    icon: <Users className="w-4 h-4" />,
    prompt: '[ROLE: High Arbiter of Rules] We have a rules dispute that needs to be settled. Please ask us to describe the situation so you can give a definitive ruling.',
  },
  {
    id: 'clarify',
    label: 'Rules Help',
    icon: <BookOpen className="w-4 h-4" />,
    prompt: '[ROLE: Keeper of the Tome] I am confused about a game rule. Please ask me which specific rule I need help with.',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: <Target className="w-4 h-4" />,
    prompt: '[ROLE: Battle Tactician Alaric] I need strategic help with a board game. Please ask me about my current game situation.',
  },
];

// Fallback responses when API is unavailable (one per persona)
const fallbackResponses: Record<string, string> = {
  recommend: `📚 **The Grand Librarian speaks...**

Greetings, seeker of new adventures! Before I open the forbidden archives, tell me:

1. **What games have you enjoyed recently?** (e.g., Catan, Wingspan, Gloomhaven)
2. **What vibe are you seeking?** 
   - 🤝 Co-op (work together)
   - 🗡️ Betrayal (hidden traitors)
   - 🧠 Heavy Strategy (brain-burners)
   - 🎉 Light & Fun (party games)

Share your preferences, and I shall reveal 3 hidden gems - not the obvious choices everyone knows!`,

  settle: `⚖️ **The High Arbiter has entered.**

I am the neutral judge of all rules disputes. I take no sides.

**State your case:**
1. Which game are you playing?
2. What is the disputed action or rule?
3. What do each of the parties believe should happen?

Once you describe the situation, I will:
✓ Cite the specific rule from the manual
✓ Deliver a **final, binding ruling**

Speak now. Justice awaits.`,

  clarify: `📖 **The Keeper of the Tome opens the manual...**

I am here to find the EXACT rule you need - no guessing, no creative interpretation.

Tell me:
1. **Which game?**
2. **Which specific mechanic or situation confuses you?**

I will provide:
- The **exact rule** as written in the manual
- A **simplified version** in plain language

If the rule does not exist in my knowledge, I will tell you immediately. I do not fabricate rules.

What do you need clarified?`,

  strategy: `⚔️ **Alaric, the Battle Tactician, enters the war room.**

Before I devise your path to victory, brief me on the battlefield:

1. **What game are you playing?**
2. **What is your current situation?** (resources, position, turn number)
3. **Who are you facing?** (opponent strengths/weaknesses)

I will analyze and provide **3 distinct options:**
- 🔴 **AGGRESSIVE** - High risk, high reward
- 🔵 **DEFENSIVE** - Secure your position
- 🟡 **TRICKY** - Unexpected maneuver

Then I will recommend the optimal path. Speak!`,

  default: `Greetings! I serve in many roles:

⚖️ **Settle Dispute** - I become the High Arbiter, a neutral judge
📖 **Rules Help** - I become the Keeper of the Tome, citing exact rules
⚔️ **Strategy** - I become Alaric, the Battle Tactician
📚 **Recommend** - I become the Grand Librarian of hidden gems

Choose a quick action above, or describe what you need!`
};

// Type for tracking game state context (sent with Quick Actions)
interface GameStateContext {
  currentGame?: string;
  playerCount?: number;
  currentTurn?: number;
  playerResources?: string;
  playerPosition?: string;
  opponentInfo?: string;
  additionalContext?: string;
}

export default function WizardChat() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Last known game state - provides context to AI for better responses
  const [lastKnownGameState, setLastKnownGameState] = useState<GameStateContext>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { chatMessages, addChatMessage, loadLibrary, games } = useGameStore();
  
  /**
   * Build context string from last known game state
   * This is prepended to Quick Action prompts
   */
  const buildContextString = (): string => {
    const parts: string[] = [];
    
    if (lastKnownGameState.currentGame) {
      parts.push(`Game: ${lastKnownGameState.currentGame}`);
    }
    if (lastKnownGameState.playerCount) {
      parts.push(`Players: ${lastKnownGameState.playerCount}`);
    }
    if (lastKnownGameState.currentTurn) {
      parts.push(`Turn: ${lastKnownGameState.currentTurn}`);
    }
    if (lastKnownGameState.playerResources) {
      parts.push(`Resources: ${lastKnownGameState.playerResources}`);
    }
    if (lastKnownGameState.playerPosition) {
      parts.push(`Position: ${lastKnownGameState.playerPosition}`);
    }
    if (lastKnownGameState.opponentInfo) {
      parts.push(`Opponent: ${lastKnownGameState.opponentInfo}`);
    }
    if (lastKnownGameState.additionalContext) {
      parts.push(lastKnownGameState.additionalContext);
    }
    
    return parts.length > 0 ? `Context: ${parts.join(', ')}. ` : '';
  };
  
  /**
   * Extract game state from user messages automatically
   */
  const extractGameStateFromMessage = (message: string) => {
    const newState = { ...lastKnownGameState };
    
    // Detect game mentions
    const gamePatterns = [
      { pattern: /catan|settlers/i, game: 'Catan' },
      { pattern: /ticket.*ride/i, game: 'Ticket to Ride' },
      { pattern: /wingspan/i, game: 'Wingspan' },
      { pattern: /scythe/i, game: 'Scythe' },
      { pattern: /azul/i, game: 'Azul' },
      { pattern: /pandemic/i, game: 'Pandemic' },
      { pattern: /terraforming mars/i, game: 'Terraforming Mars' },
    ];
    
    for (const { pattern, game } of gamePatterns) {
      if (pattern.test(message)) {
        newState.currentGame = game;
        break;
      }
    }
    
    // Detect player count
    const playerMatch = message.match(/(\d+)\s*players?/i);
    if (playerMatch) {
      newState.playerCount = parseInt(playerMatch[1]);
    }
    
    // Detect turn number
    const turnMatch = message.match(/turn\s*(\d+)/i);
    if (turnMatch) {
      newState.currentTurn = parseInt(turnMatch[1]);
    }
    
    // Detect resources mentioned
    const resourcePatterns = [
      /(\d+)\s*(ore|wheat|wood|brick|sheep|grain)/gi,
      /(\d+)\s*(cards?|points?|coins?|gold|money)/gi,
      /(\d+)\s*(food|eggs?|birds?)/gi,
    ];
    
    for (const pattern of resourcePatterns) {
      const matches = message.match(pattern);
      if (matches) {
        newState.playerResources = matches.join(', ');
        break;
      }
    }
    
    setLastKnownGameState(newState);
  };

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * SendChatMessage - Sends a message to the AI via API route
   */
  async function SendChatMessage(userMessage: string): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        gameLibrary: games,
        chatHistory: chatMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 500 && errorData.error?.includes('API key')) {
        throw new Error('API_KEY_INVALID');
      }
      if (response.status === 500) {
        throw new Error('SERVER_ERROR');
      }
      throw new Error('UNKNOWN_ERROR');
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Main send message function with error handling
   */
  const sendMessage = async (messageText: string, quickAction?: string) => {
    if (!messageText.trim() || isLoading) return;

    setError(null);
    extractGameStateFromMessage(messageText);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      quickAction,
    };

    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    let assistantContent: string;

    try {
      assistantContent = await SendChatMessage(messageText);
    } catch (err) {
      const error = err as Error;
      console.error('Chat error:', error.message);

      if (error.message === 'API_KEY_INVALID') {
        setError('⚠️ The API key is invalid or not configured. Using offline mode.');
      } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setError('🌐 Network error - please check your internet connection. Using offline mode.');
      } else if (error.message === 'SERVER_ERROR') {
        setError('⚠️ Server error occurred. Using offline mode.');
      } else {
        setError('⚠️ Could not reach the AI. Using offline mode.');
      }

      // Fall back to built-in responses
      assistantContent = getSmartResponse(messageText, quickAction);
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    };

    addChatMessage(assistantMessage);
    setIsLoading(false);
  };

  /**
   * Handle Quick Action button clicks
   * Appends game state context to the prompt
   */
  const handleQuickAction = (action: QuickAction) => {
    const contextString = buildContextString();
    const messageWithContext = contextString + action.prompt;
    sendMessage(messageWithContext, action.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ... rest of component (UI rendering)
}
```

---

### 3.4 State Management (`lib/store/gameStore.ts`)

Zustand store for managing game library, chat messages, and play sessions.

```typescript
import { create } from 'zustand';
import { Game, ChatMessage, PlaySession } from '@/types/game';
import {
  getGameLibrary,
  addGameToLibrary as saveGame,
  removeGameFromLibrary as removeGame,
  toggleFavorite as toggleFavoriteStorage,
  addCustomGame as saveCustomGame,
} from '@/lib/storage';

interface GameStore {
  // Library state
  games: Game[];
  favorites: string[];
  customGames: Game[];
  isLoading: boolean;

  // Chat state
  chatMessages: ChatMessage[];

  // Play session state
  currentSession: PlaySession | null;

  // Actions
  loadLibrary: () => void;
  addGame: (game: Game) => void;
  removeGame: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  addCustomGame: (game: Game) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setCurrentSession: (session: PlaySession | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  favorites: [],
  customGames: [],
  isLoading: false,
  chatMessages: [],
  currentSession: null,

  loadLibrary: () => {
    set({ isLoading: true });
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
      customGames: library.customGames,
      isLoading: false,
    });
  },

  addGame: (game: Game) => {
    saveGame(game);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
  },

  removeGame: (gameId: string) => {
    removeGame(gameId);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
  },

  toggleFavorite: (gameId: string) => {
    toggleFavoriteStorage(gameId);
    const library = getGameLibrary();
    set({
      games: library.games,
      favorites: library.favorites,
    });
  },

  addCustomGame: (game: Game) => {
    saveCustomGame(game);
    const library = getGameLibrary();
    set({
      games: library.games,
      customGames: library.customGames,
    });
  },

  addChatMessage: (message: ChatMessage) => {
    set(state => ({
      chatMessages: [...state.chatMessages, message],
    }));
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  setCurrentSession: (session: PlaySession | null) => {
    set({ currentSession: session });
  },
}));
```

---

### 3.5 Environment Variables (`.env.local`)

```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

---

## 4. Current Issues / Help Needed

1. **Gemini API Integration**: Having trouble with model availability (`gemini-1.5-flash` returning 404 errors)

2. **Quick Action Buttons**: Need help ensuring the role-based prompts correctly switch the AI's persona

3. **Game State Context**: The `lastKnownGameState` is being extracted from messages but may need better parsing

---

## 5. Data Flow Summary

```
User clicks Quick Action button
       ↓
handleQuickAction() builds context string
       ↓
sendMessage() extracts game state from message
       ↓
SendChatMessage() calls /api/chat
       ↓
API route calls chatWithWizard() from lib/gemini.ts
       ↓
Gemini SDK sends request to Google AI
       ↓
Response returned and displayed in chat UI
       ↓
If error: fallback responses are used
```

---

*Generated for external AI expert consultation*

