# Step 5: Start Your Application 🚀

## ✅ Your API Key is Saved!
Now let's start the app and see it in action!

---

## Step-by-Step Instructions

### 1. Go Back to Your Terminal

Make sure you're still in the project folder. If you see this prompt, you're good:
```
javied@Javiers-Mac-mini Mr. GameBoard %
```

If you're not in the right folder, type:
```bash
cd "/Volumes/TESLADRIVE/Cursor Projects/Mr. GameBoard"
```

### 2. Start the Development Server

Type this command and press Enter:
```bash
npm run dev
```

### 3. Wait for It to Start

You should see output like this:
```
> mr-boardgame@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000

 ✓ Ready in 2.3s
 ○ Local:        http://localhost:3000
```

**Important:** 
- Wait until you see "Ready" ✅
- Don't close the terminal or stop the process
- Keep the terminal window open while using the app

### 4. Open in Your Browser

1. **Open any web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to this address:**
   ```
   http://localhost:3000
   ```

3. **You should see the Mr. Board Game application!** 🎉

---

## What You Should See

When you open http://localhost:3000, you should see:
- 🧙 An animated wizard character at the top
- 🔮 A glowing crystal ball in the middle
- 💬 A chat interface at the bottom

---

## Testing the App

### Try These Things:

1. **Crystal Ball:**
   - Click the `+` or `-` buttons to change player count
   - Click "Ask the Crystal Ball" to get a game recommendation

2. **Wizard Chat:**
   - Try the quick action buttons at the top
   - Or type a question like: "What's a good 4-player strategy game?"

3. **Navigation:**
   - Click "Library" to see your game library
   - Click "Play Mode" to start a game session

---

## Troubleshooting

### If you see an error about the API key:
- Make sure `.env.local` has your key on one line
- No spaces around the `=` sign
- Restart the server: Press `Ctrl + C`, then run `npm run dev` again

### If port 3000 is busy:
```bash
npm run dev -- -p 3001
```
Then go to: http://localhost:3001

### If the page won't load:
- Make sure the terminal shows "Ready"
- Check that you're going to http://localhost:3000 (not https)
- Look at the terminal for error messages

---

## Stopping the Server

When you're done using the app:
- Go back to the terminal
- Press `Ctrl + C`
- Type `Y` if it asks to confirm

---

## 🎉 You're Done!

Your app should now be running. Enjoy exploring Mr. Board Game!
