# Supabase & Vercel Setup Guide — CrickScore

This step-by-step guide explains how to set up your Supabase backend (Database, Auth, Realtime) and deploy your **CrickScore** web application to Vercel.

---

## 🗄️ PART 1: Supabase Setup (Database, Auth, Realtime)

### Step 1: Create a New Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose your Organization, set **Name** to `crickscore`, choose a secure **Database Password**, and select your nearest region.
4. Click **Create new project** and wait 1–2 minutes for provision.

### Step 2: Retrieve API Keys
1. In your Supabase project dashboard, navigate to **Project Settings** -> **API**.
2. Copy the following keys:
   - **Project URL** (e.g. `https://xyz.supabase.co`)
   - **anon / public key** (e.g. `ey...`)
   - **service_role key** (e.g. `ey...`)

### Step 3: Run Database Migration Script
1. In Supabase Dashboard, click **SQL Editor** on the left menu.
2. Click **New Query**.
3. Open the migration SQL file created in your project at:
   [`supabase/migrations/20260807000000_init_cricket_schema.sql`](file:///c:/Users/deepa/Desktop/crickscore/supabase/migrations/20260807000000_init_cricket_schema.sql)
4. Copy the entire SQL script contents, paste into the Supabase SQL Editor, and click **Run**.
5. You should see `Success. No rows returned`.
6. Verify under **Table Editor** that all 11 tables (`profiles`, `tournaments`, `teams`, `players`, `venues`, `matches`, `innings`, `balls`, `match_players`, `notifications`, `services`) are created.

### Step 4: Enable Realtime Subscriptions
To allow live scorecards and commentary to update automatically without page refresh:
1. Navigate to **Database** -> **Publications** in Supabase Dashboard.
2. Click on **`supabase_realtime`**.
3. Enable replication/publication for the following tables:
   - `matches`
   - `innings`
   - `balls`

### Step 5: Configure Supabase Auth Redirect URLs
1. Navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL**: `http://localhost:3000` (for local development) or `https://your-app.vercel.app` (for production).
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `https://*.vercel.app/**`

---

## 🔑 PART 2: Update Local Environment Variables

Open `c:\Users\deepa\Desktop\crickscore\.env.local` and replace placeholders with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 PART 3: GitHub & Vercel Deployment Setup

### Step 1: Push Repository to GitHub
1. Create a new repository on GitHub named `crickscore`.
2. Run the following commands in your project terminal:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/crickscore.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import & Deploy on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `crickscore` GitHub repository.
4. Framework Preset will automatically select **Next.js**.
5. Expand **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-key` |
| `NEXT_PUBLIC_APP_URL` | `https://your-crickscore.vercel.app` |

6. Click **Deploy**.
7. Vercel will build and deploy your application live in under 2 minutes!

---

## 👥 PART 4: How to Create Test Users for Roles

To create test accounts with specific roles:

1. **Sign Up via App**:
   Go to `/signup` on your deployed site or local dev server. Create an account with your email and select your desired role (`Organizer`, `Scorer`, `Team Manager`, `Player`, or `Spectator`).

2. **Manual Role Override (Super Admin)**:
   In Supabase Dashboard -> **Table Editor** -> **`profiles`**, locate your user row and update the `role` column to:
   - `SUPER_ADMIN`
   - `ORGANIZER`
   - `SCORER`
   - `TEAM_MANAGER`
   - `PLAYER`
   - `USER`
