# Autofocus

Autofocus is a productivity system that helps you stay focused and on track. It's a simple yet powerful tool that helps you manage your tasks and prioritize your work. This project is a web application that implements the Autofocus system.

---

# Features

- Single-list task management with AF4 page-based workflow
- Working task panel with live timer (start / pause / resume / stop)
- Task tags with filter bar — add tags in `src/lib/tags.ts`
- Completed tasks view grouped by date and time of day
- Mobile swipe-to-reveal action tray
- Dark / light theme
- Second Brain quick-links panel (Notion integration)
- Fully persistent via Supabase — syncs across devices

---

# Why I Built It?

I built Autofocus because I wanted to create a tool that helps me stay focused and productive. I found that traditional task management systems can be overwhelming and distracting, so I wanted to create a simple and intuitive tool that helps me stay on track.
I also wanted to create a tool that is customizable to my needs. Autofocus allows me to prioritize my tasks and tag them in a way that makes sense to me. It also provides a task history so that I can see what I've done in the past and learn from it.
Overall, Autofocus is a tool that helps me stay focused, productive, and organized.

---

# Tech Stack

- Next.js: A React framework for building server-rendered applications.
- React: A JavaScript library for building user interfaces.
- Tailwind CSS: A utility-first CSS framework for rapidly building custom user interfaces.
- Lucide Icons: A collection of open-source icons.
- SWR: A React hook library for data fetching.
- Class Variance Authority: A library for managing CSS class variants.
- TypeScript: A statically typed superset of JavaScript.
- Tailwind Utilities: A collection of utility styles for Tailwind CSS.
- Radix UI: A set of accessible, modular, and responsive UI components.
- DND Kit: A library for building drag-and-drop interfaces.
- Date FNS: A library for working with dates and times.
- Supabase: A platform for building and deploying full-stack applications.
- Google Fonts: A library of open-source fonts.

---

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is fine)

---

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, name the project (e.g. `af4-autofocus`), pick a region close to you, and set a database password — save this somewhere safe
4. Wait for the project to finish provisioning (~1 minute)

---

### Step 2 — Run the database schema

1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste the entire contents of `create_tables_starter.sql` into the editor
4. Click **Run** (or `Cmd+Enter` / `Ctrl+Enter`)
5. You should see `Success. No rows returned` — tables and indexes are now created

---

### Step 3 — Get your Supabase credentials

1. In your Supabase project, go to **Settings → API**
2. Copy two values:
   - **Project URL** — looks like `https://xxxx.supabase.co`
   - **Anon/public key** — a long JWT string

---

### Step 4 — Configure environment variables

In the root of the project, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 5 — Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 6 — Verify

1. Add a task — it should appear instantly
2. Complete a task — it should move to the Completed view
3. Refresh the page — all data should persist
4. Open the app on another device — data should be in sync

---

## Adding New Tags

Tags are defined in `src/lib/tags.ts`:

```typescript
export const TAG_DEFINITIONS = [
	{ id: "read" as const, label: "to Read", emoji: "📚" },
	{ id: "learn" as const, label: "to Learn", emoji: "🎓" },
	{ id: "finish" as const, label: "to Finish", emoji: "📋" },
	// Add new tags here — no SQL migration needed
	{ id: "watch" as const, label: "to Watch", emoji: "👀" },
] as const;
```

The `tag` column in Supabase has no `CHECK` constraint — TypeScript enforces valid values. Just add the entry to `TAG_DEFINITIONS` and everything (picker, filter, pill) updates automatically.

---

## Resetting All Data

To wipe all tasks and reset app state, run this in the Supabase SQL Editor:

```sql
DELETE FROM tasks;
UPDATE app_state
SET current_page = 1,
    working_on_task_id = NULL,
    session_start_time = NULL,
    timer_state = 'idle',
    current_session_ms = 0
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## Troubleshooting

**App shows "Loading..." and never loads**

- Check your `.env.local` credentials are correct and the file is saved
- Check your Supabase project is not paused — free tier projects pause after 1 week of inactivity, unpause from the Supabase dashboard

**Tasks not persisting after refresh**

- Confirm the SQL schema ran without errors in the Supabase SQL Editor
- Check the browser console for Supabase error messages

**Timer appears frozen**

- The app polls `app_state` every second — check your network connection

**"violates check constraint" error when assigning a tag**

- Your Supabase project has an old schema with a `CHECK` constraint on the `tag` column
- Fix: run this in the SQL Editor:

```sql
  ALTER TABLE tasks DROP CONSTRAINT tasks_tag_check;
```

---

## Deployment

The app deploys to [Vercel](https://vercel.com) without any configuration changes:

1. Push the repo to GitHub
2. Import the project on Vercel
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings
4. Deploy

The same `.env.local` variables work in Vercel's environment variable settings.
