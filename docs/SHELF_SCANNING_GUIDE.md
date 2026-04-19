# 📸 SHELF SCANNING FEATURE - USER GUIDE

## ✨ **NEW FEATURE: AI-Powered Shelf Scanner**

You can now take a photo of your board game shelf and let AI automatically detect and add games to your library!

---

## 🎯 **How It Works**

The feature uses **Google Gemini Vision AI** (the same AI that powers your chatbot) to:
1. Analyze photos of your game collection
2. Identify games by their spines, box art, or titles
3. Create a confirmation list for you to review
4. Automatically search BoardGameGeek and add selected games

---

## 📱 **How to Use**

### **Step 1: Open the Scanner**
1. Go to your **Library** page
2. Click the **"Scan Shelf" button** (camera icon) in the top right
   - It has a purple-cyan gradient and stands out!

### **Step 2: Take or Upload a Photo**
- **Mobile**: Click "Choose Image" → Select "Camera" to take a live photo
- **Desktop**: Click "Choose Image" → Select an existing photo

### **Step 3: Tips for Best Results** 📸
- ✅ **Good lighting** - Avoid shadows and glare
- ✅ **Clear titles** - Make sure game names are readable
- ✅ **Stable camera** - Avoid blurry photos
- ✅ **Close enough** - Game titles should be legible
- ✅ **Either orientation** - Horizontal or vertical both work

### **Step 4: AI Analysis**
1. Click **"Detect Games"**
2. Wait 5-10 seconds while AI analyzes
3. See the list of detected games!

### **Step 5: Review & Confirm**
You'll see a list with:
- ✅ **Game name** - What the AI detected
- 📍 **Location** - Where it saw it (e.g., "top shelf, left side")
- 🎯 **Confidence level**:
  - **High** (green) - Very confident, auto-selected
  - **Medium** (yellow) - Pretty sure
  - **Low** (orange) - Might be wrong

### **Step 6: Add to Library**

**Option A: Add Individual Games**
- Click **"Add Now"** next to any game
- It will search BGG and add immediately

**Option B: Add Multiple at Once**
- Check/uncheck games you want
- Click **"Add Selected (X)"** at the bottom
- All selected games will be added

### **Step 7: Done!**
- Games are automatically added to your library
- Click **"Scan Another Shelf"** to scan more
- Or close the modal

---

## 🎨 **What You'll See**

### Detection Results:
```
Found 12 games!

✓ Catan                           HIGH confidence    [Add Now]
  (top shelf, center)

✓ Wingspan                        HIGH confidence    [Add Now]
  (second shelf, left side)

✓ Azul                           MEDIUM confidence   [Add Now]
  (middle shelf, center)
```

---

## 💡 **Pro Tips**

### **For Better Detection:**
1. **Take multiple photos** if you have a large collection
2. **Focus on one shelf at a time** for accuracy
3. **Make sure spines are visible** - AI reads text better than box tops
4. **Natural daylight** works best
5. **Avoid reflections** on plastic game covers

### **If Games Aren't Detected:**
- Try a closer photo
- Improve lighting
- Make sure titles are visible
- Manually search instead (some obscure games might not be recognized)

### **If Wrong Games Are Detected:**
- Just uncheck them before adding
- Click individual "Add Now" buttons for ones you trust
- You can always remove games later

---

## 🔧 **Technical Details**

### **What Powers This:**
- **AI Model**: Google Gemini 1.5 Flash with Vision
- **Search**: BoardGameGeek API integration
- **Storage**: Local browser storage (like your other games)

### **Supported Images:**
- **Formats**: JPG, PNG, WEBP, HEIC
- **Max Size**: 10MB per photo
- **Orientation**: Any (automatically handled)

### **Privacy:**
- Images are sent to Google Gemini for analysis
- Images are NOT stored on any server
- Only game names are saved to your library
- All processing happens in real-time

---

## 🎯 **Use Cases**

### **Perfect For:**
- 📦 **New User Setup** - Quickly add your entire collection
- 🏠 **Moving/Organizing** - Catalog multiple shelves at once
- 🎁 **After Game Shopping** - Snap and add your new haul
- 🔄 **Inventory Check** - Compare physical vs. digital library
- 👥 **Friend's Collection** - Catalog a friend's games (with permission!)

### **Also Great For:**
- Photographing game stores or cafe shelves
- Building a wishlist from a photo
- Identifying games you don't recognize
- Quickly sharing what games you saw somewhere

---

## ⚠️ **Limitations**

### **AI May Miss:**
- Games with very small/unclear spines
- Games in non-English languages (sometimes)
- Custom/homebrew games
- Games stored in boxes without visible titles
- Games with heavy glare or shadows

### **AI May Confuse:**
- Expansion boxes for base games
- Similar-looking game titles
- Damaged or faded boxes

**Solution:** Just review the list carefully before adding!

---

## 🆕 **Example Workflow**

```
1. You: *Takes photo of shelf*
2. AI: "Found 8 games!"
   - Catan (HIGH) ✓
   - Ticket to Ride (HIGH) ✓
   - Azul (MEDIUM) ✓
   - Unknown Game (LOW) ✗

3. You: *Unchecks "Unknown Game"*
4. You: *Clicks "Add Selected (3)"*
5. App: *Searches BGG, adds all 3 games*
6. Done! 🎉
```

---

## 🔮 **Future Enhancements**

We're working on:
- 🎥 **Video mode** - Scan while panning across shelf
- 🔄 **Bulk processing** - Upload multiple photos at once
- 🏷️ **Label detection** - Read custom shelf labels
- 📊 **Price estimation** - Estimate collection value
- 🌍 **Multi-language** - Support for non-English games

---

## ❓ **FAQ**

**Q: Does this work on mobile?**
A: Yes! Works great on phones and tablets. Just use your camera.

**Q: How accurate is it?**
A: Very good for popular games with clear titles. May struggle with obscure titles or poor lighting.

**Q: Does it cost extra?**
A: No! It uses your existing Gemini API key (same as the chatbot).

**Q: Can I scan multiple shelves?**
A: Yes! Just click "Scan Another Shelf" after each one.

**Q: What if it gets a game wrong?**
A: Just uncheck it before adding. You can always manually search for the correct game.

**Q: Will this add duplicates?**
A: The app checks if games already exist before adding.

**Q: Can I use this offline?**
A: No, it requires internet to analyze images and search BGG.

**Q: Does it work with expansions?**
A: Sometimes! Review carefully as it may detect expansions as base games.

---

## 🎉 **Try It Now!**

1. Go to **Library** page
2. Click **"Scan Shelf"** button (📷)
3. Take a photo of your games
4. Watch the magic happen! ✨

---

## 💬 **Feedback**

Found an issue or have suggestions? The AI detection improves over time, so your feedback helps!

**Common Issues:**
- "No games detected" → Try better lighting
- "Wrong games detected" → Just uncheck them
- "Image too large" → Compress or resize photo

---

**Happy Scanning! 📸🎲**

Your board game library just got a whole lot easier to manage!

