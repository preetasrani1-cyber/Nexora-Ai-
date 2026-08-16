# Nexora AI

A premium, minimal AI chat assistant built with Next.js, powered by
Groq's free API (Llama 3.3 70B) — no billing required.

## Setup

```bash
npm install
cp .env.example .env.local
# get a free key at https://console.groq.com (no credit card), then
# add it to .env.local along with the Supabase values — see
# "Sign-in & synced history" below
npm run dev
```

Open http://localhost:3000.

## Sign-in & synced history

Google sign-in is powered by Supabase (handles OAuth + gives us a database
for chat history in one free service).

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and fill in a
   Google OAuth Client ID/Secret (create one in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials) —
   authorized redirect URI is `https://<your-project>.supabase.co/auth/v1/callback`).
3. In **Project Settings → API**, copy the **Project URL** and **anon public**
   key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run `sql/schema.sql` in the Supabase SQL Editor to create the `chats`
   table with row-level security (each user can only read/write their own rows).
5. In **Authentication → URL Configuration**, add your site's URL (and
   `http://localhost:3000` for local dev) to the redirect allow list.

Signed-out users still get full local chat history via `localStorage` —
nothing is required to use the app without an account. On first sign-in,
any local chats on that device are uploaded to the account automatically.

## Architecture

```
UI (app/page.js, components/)
      ↓
/api/chat  (server-side route, streams text)
      ↓
lib/providers/  (provider abstraction)
      ↓
Groq API (lib/providers/groq.js)
```

The API key lives only in `.env.local` and is read server-side inside
`lib/providers/groq.js`. It's never sent to the browser.

Groq's free tier requires no credit card and no billing setup — it's
rate-limited (requests/tokens per minute and per day) rather than
metered by cost, so normal personal or small-scale use won't be charged
anything. If you outgrow the free tier, Groq's paid tier or any other
provider can be swapped in without touching the UI.

To add a second provider (e.g. OpenAI, Anthropic), create
`lib/providers/openai.js` exporting the same
`{ id, label, models, streamChat }` shape, then register it in
`lib/providers/index.js`. Nothing in the UI or the API route needs to
change.

## Features

- Streaming responses
- Markdown rendering (headings, lists, tables, code blocks with copy button)
- Local chat history (new / rename / delete), stored in `localStorage`
- Optional Google sign-in (Supabase) to sync chat history across devices
- Dark mode by default, with a light mode toggle in Settings
- Adjustable model temperature
- Responsive layout, mobile-friendly sidebar
- Graceful error handling for network/API failures

## Stack

Next.js 14 (App Router), React, Tailwind CSS, Groq (free, OpenAI-compatible
API), `react-markdown`.
