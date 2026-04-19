# Supabase Setup Guide for Mr. Board Game

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Set project name: "mr-boardgame"
5. Set database password (save this!)
6. Choose region (closest to you)
7. Click "Create new project"

### 2. Get Your Keys
1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

### 3. Set Environment Variables
Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Existing keys
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 4. Run Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## 📊 Database Schema

### Tables Created

**users**
- `id` (uuid, primary key)
- `email` (text, unique)
- `created_at` (timestamp)
- `is_pro` (boolean)
- `pro_expires_at` (timestamp)

**games**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `bgg_id` (integer)
- `name` (text)
- `image` (text)
- `data` (jsonb) - full game data
- `is_favorite` (boolean)
- `created_at` (timestamp)

**play_sessions**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `game_id` (uuid, foreign key)
- `date` (timestamp)
- `duration` (integer)
- `players` (jsonb)
- `notes` (text)
- `rating` (integer)
- `created_at` (timestamp)

**achievements**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `achievement_id` (text)
- `unlocked_at` (timestamp)
- `xp` (integer)

**strategies**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `game_id` (uuid, foreign key)
- `title` (text)
- `content` (text)
- `category` (text)
- `rating` (integer)
- `upvotes` (integer)
- `created_at` (timestamp)

**wishlist**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `game_data` (jsonb)
- `priority` (text)
- `notes` (text)
- `created_at` (timestamp)

**game_nights**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `title` (text)
- `date` (timestamp)
- `location` (text)
- `players` (jsonb)
- `suggested_games` (jsonb)
- `votes` (jsonb)
- `status` (text)
- `created_at` (timestamp)

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only access their own data
- Public read for shared strategies
- Authenticated users required for all operations

---

## 📦 Installation

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## 🔄 Migration Strategy

### Phase 1: Dual Write (Current)
- Write to both localStorage AND Supabase
- Read from localStorage (faster)
- Background sync to Supabase

### Phase 2: Gradual Migration
- Migrate existing users one feature at a time
- Games → Sessions → Achievements → etc.

### Phase 3: Full Migration
- Read from Supabase
- localStorage as cache only
- Real-time sync

---

## 🎯 Benefits After Migration

✅ **Cloud Sync** - Access from any device
✅ **Data Backup** - Never lose your collection
✅ **Multi-Device** - Phone, tablet, desktop
✅ **Real-Time** - Live updates
✅ **Social Features** - Share strategies, game nights
✅ **Analytics** - Better insights
✅ **Security** - Encrypted, secure
✅ **Scalability** - Handle millions of records

---

## 🚀 Next Steps

1. Create Supabase account
2. Run `npm install @supabase/supabase-js @supabase/auth-helpers-nextjs`
3. Add environment variables
4. Run migrations (see `/supabase/migrations/`)
5. Test with a new account
6. Migrate existing users

---

**Ready to launch!** 🎊

