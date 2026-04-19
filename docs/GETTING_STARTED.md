# Getting Started with Mr. Board Game 🎲

Welcome! This guide will help you get your board game application up and running step by step.

## Prerequisites

Before you begin, make sure you have:
- **Node.js** installed (version 18 or higher)
  - Check if you have it: Open Terminal and type `node --version`
  - If you don't have it, download from: https://nodejs.org/
- **npm** (comes with Node.js)
  - Check if you have it: Type `npm --version`
- **An OpenAI API Key** (for the AI wizard chatbot)
  - Get one at: https://platform.openai.com/api-keys
  - You'll need to create an account and add payment info

## Step-by-Step Setup

### Step 1: Open Terminal/Command Prompt

- **On Mac**: Press `Cmd + Space`, type "Terminal", and press Enter
- **On Windows**: Press `Win + R`, type "cmd", and press Enter

### Step 2: Navigate to Your Project Folder

In the terminal, type:
```bash
cd "/Volumes/TESLADRIVE/Cursor Projects/Mr. GameBoard"
```

Then press Enter.

### Step 3: Install Dependencies

This will download all the code libraries the app needs:
```bash
npm install
```

Wait for it to finish (this may take a few minutes). You'll see a success message when done.

### Step 4: Create Environment File

You need to create a file to store your OpenAI API key securely.

**On Mac:**
```bash
touch .env.local
```

**On Windows:**
```bash
type nul > .env.local
```

### Step 5: Add Your API Key

Open the `.env.local` file in a text editor (you can use Cursor, VS Code, or any text editor) and add this line:

```
OPENAI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with your actual OpenAI API key (the one you got from step 1).

**Important:** Make sure there are no spaces around the `=` sign!

### Step 6: Start the Development Server

Run this command:
```bash
npm run dev
```

You should see output that looks like:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### Step 7: Open the Application

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:3000**
3. You should see the Mr. Board Game application!

## How to Use the Application

### Home Page
- **Wizard Character**: Animated wizard at the top
- **Crystal Ball**: 
  - Adjust player count with +/- buttons
  - Click "Ask the Crystal Ball" to get a game recommendation
- **Wizard Chat**: 
  - Ask questions about board games
  - Use quick action buttons for common requests

### Library Page
- **Search**: Type a game name to search BoardGameGeek database
- **Add Games**: Click on search results to add to your library
- **Favorites**: Click the heart icon to favorite games
- **Custom Games**: Click "Custom Game" button to add games not in the database
- **Recommendations**: Click "Get Recommendations" for AI-powered suggestions

### Play Mode Page
1. **Select Game**: Choose a game from your library
2. **Setup Players**: Add players and their roles/attributes
3. **Setup Guide**: Follow step-by-step setup instructions
4. **Practice Round**: Get guided turn-by-turn instructions
5. **Utilities**: Use dice roller, score tracker, and timer

## Troubleshooting

### "command not found: npm"
- Make sure Node.js is installed
- Restart your terminal after installing Node.js

### "Cannot find module" errors
- Make sure you ran `npm install` in the correct folder
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### "OPENAI_API_KEY is not configured"
- Make sure `.env.local` file exists in the project root
- Make sure the file contains: `OPENAI_API_KEY=your_key_here`
- Restart the dev server (Ctrl+C, then `npm run dev` again)

### "Port 3000 is already in use"
- Another app might be using port 3000
- Stop the other app, or use: `npm run dev -- -p 3001`

### The page won't load
- Make sure the dev server is running (`npm run dev`)
- Check that you're going to http://localhost:3000
- Look for error messages in the terminal

## Stopping the Server

When you're done, press `Ctrl + C` in the terminal to stop the development server.

## Need Help?

- Check the terminal for error messages
- Make sure all files were created correctly
- Verify your API key is correct
- Try restarting the development server

## Next Steps

Once it's running:
1. Add some games to your library
2. Try the crystal ball feature
3. Chat with the wizard
4. Start a play mode session

Have fun! 🎲✨
