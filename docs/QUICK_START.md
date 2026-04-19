# Quick Start Guide 🚀

## ⚠️ IMPORTANT: First Step - Install Node.js

You need to install Node.js before you can run this application.

### How to Install Node.js:

1. **Go to this website**: https://nodejs.org/
2. **Download the LTS version** (it will say something like "Recommended For Most Users")
3. **Run the installer**:
   - On Mac: Double-click the `.pkg` file and follow the installation wizard
   - On Windows: Double-click the `.msi` file and follow the installation wizard
4. **Restart your computer** after installation
5. **Verify installation**: 
   - Open Terminal (Mac) or Command Prompt (Windows)
   - Type: `node --version`
   - You should see a version number (like v18.17.0)
   - Type: `npm --version`
   - You should see another version number

## Once Node.js is Installed, Follow These Steps:

### Step 1: Open Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

### Step 2: Go to Your Project Folder
Copy and paste this command, then press Enter:
```bash
cd "/Volumes/TESLADRIVE/Cursor Projects/Mr. GameBoard"
```

### Step 3: Install Project Dependencies
Copy and paste this command, then press Enter:
```bash
npm install
```

**Wait for this to finish!** It will take 1-3 minutes. You'll see lots of text scrolling by - that's normal!

### Step 4: Create Environment File
You need to create a file called `.env.local` to store your OpenAI API key.

**On Mac, type:**
```bash
touch .env.local
```

**On Windows, type:**
```bash
echo. > .env.local
```

### Step 5: Get an OpenAI API Key
1. Go to: https://platform.openai.com/signup
2. Create an account (or sign in if you have one)
3. Go to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (it will look like: `sk-...`)
6. **Important**: Save it somewhere safe - you won't see it again!

### Step 6: Add API Key to Your File
1. Open the file `.env.local` in Cursor (or any text editor)
2. Add this line (replace `your_key_here` with your actual key):
```
OPENAI_API_KEY=sk-your-actual-key-here
```
3. Save the file

**Important Notes:**
- No spaces around the `=` sign
- No quotes needed
- Make sure the file is saved as `.env.local` (starts with a dot)

### Step 7: Start the Application
In your terminal, type:
```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

### Step 8: Open in Browser
1. Open your web browser (Chrome, Safari, Firefox, etc.)
2. Go to: **http://localhost:3000**
3. You should see the Mr. Board Game app!

## 🎉 You're Done!

The app is now running. To stop it later, press `Ctrl + C` in the terminal.

## Troubleshooting

**"node: command not found"**
→ You need to install Node.js first (see above) and restart your computer

**"npm: command not found"**
→ You need to install Node.js first (see above) and restart your computer

**"Cannot find module" errors**
→ Make sure you're in the correct folder and ran `npm install`

**"OPENAI_API_KEY is not configured"**
→ Make sure `.env.local` exists and has your API key
→ Restart the server (press Ctrl+C, then run `npm run dev` again)

**Port 3000 is already in use**
→ Type: `npm run dev -- -p 3001`
→ Then go to: http://localhost:3001

---

**Need more help?** See GETTING_STARTED.md for detailed instructions!
