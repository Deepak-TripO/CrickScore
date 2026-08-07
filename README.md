# CrickScore — Local Cricket Match Organizer & Live Score Platform

A production-ready, full-stack web application designed for local cricket match organization, tournament management, team rosters, venue bookings, and real-time ball-by-ball live scoring.

---

## ⚡ Key Features

1. **Live Ball-by-Ball Scoring Interface**:
   - Single-tap run buttons (`0`, `1`, `2`, `3`, `4`, `5`, `6`).
   - Extras toggles (`WIDE`, `NO_BALL`, `BYE`, `LEG_BYE`).
   - Wicket modal with dismissal types (`BOWLED`, `CAUGHT`, `LBW`, `RUN_OUT`, `STUMPED`, `HIT_WICKET`).
   - Strike rotation engine & over completion alerts.
   - `Undo Last Ball` transactional state recovery.
2. **Real-time Live Scorecard & Commentary (`/matches/[id]`)**:
   - Live score banner, target required run rate (RRR), current partnership, recent delivery pills (`1 4 0 W 2 6`), full batting & bowling tables, fall of wickets (FOW), and live ball-by-ball commentary.
3. **Tournament Management & Net Run Rate (`/tournaments/[id]`)**:
   - Automatic Points Table calculation with Net Run Rate (NRR) formula:
     $$\text{NRR} = \left(\frac{\text{Runs Scored}}{\text{Overs Faced}}\right) - \left(\frac{\text{Runs Conceded}}{\text{Overs Bowled}}\right)$$
4. **Cricket Services Marketplace (`/services`)**:
   - Turf ground bookings, certified live scorer hire, official umpire guild, and match live stream drone coverage.
5. **Role-Based Access Control**:
   - Super Admin, Organizer, Scorer, Team Manager, Player, Spectator.
6. **Organizer Admin Command Center (`/admin`)**:
   - Analytics dashboard with Recharts, match scheduling, team/player management, venue directory, and scorer assignments.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Cricket tokens & animations
- **Database & Auth**: PostgreSQL via Supabase
- **Realtime**: Supabase Realtime subscriptions
- **Icons**: Lucide React
- **Analytics & Visuals**: Recharts & Lucide React

---

## ⚙️ Environment Variables

Create `.env.local` in your root folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Database Setup & Migrations

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration script located at [`supabase/migrations/20260807000000_init_cricket_schema.sql`](file:///c:/Users/deepa/Desktop/crickscore/supabase/migrations/20260807000000_init_cricket_schema.sql).
3. This creates all 11 core tables (`profiles`, `tournaments`, `teams`, `players`, `venues`, `matches`, `innings`, `balls`, `match_players`, `notifications`, `services`), Row Level Security (RLS) policies, and performance indexes.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CrickScore platform"
   git remote add origin https://github.com/YOUR_USERNAME/crickscore.git
   git push -u origin main
   ```
2. Import the GitHub repository into **Vercel**.
3. Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Click **Deploy**.

---

## 👥 User Roles Matrix

| Role | Access Permissions |
| --- | --- |
| **Super Admin** | Complete system control |
| **Organizer** | Create/edit tournaments, schedule matches, manage teams & venues, assign scorers |
| **Scorer** | Ball-by-ball live scoring console for assigned matches |
| **Team Manager** | Manage team roster and player details |
| **Player** | View career statistics, average, strike rate & fixtures |
| **Spectator** | Public browsing, live scorecard updates, points tables, services |

---

## 🏏 Cricket Scoring Calculation Logic

All cricket calculations are decoupled in [`src/lib/cricket/`](file:///c:/Users/deepa/Desktop/crickscore/src/lib/cricket/):
- `scoring.ts`: Ball input state transitions (Wide = 1 extra run, 0 legal balls; No Ball = 1 extra run, 0 legal balls).
- `overs.ts`: Overs decimal notation to total legal balls conversion (`18.3` = 111 legal balls).
- `innings.ts`: Batting scorecard, bowling figures, fall of wickets, partnerships, and required run rates.
- `pointsTable.ts` & `netRunRate.ts`: Tournament points & NRR math.
