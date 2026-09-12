# 👁 OUTCOGNITO

> **Search the internet. Everyone is watching.**

A parody search engine where privacy does not exist. Every search you make is publicly visible to everyone else using OUTCOGNITO in real time.

There is no incognito mode.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Search | Google Custom Search JSON API |

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd outcognito
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

PORT=3000
```

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `schema.sql`
3. Go to **Database → Replication** and enable realtime for the `searches` table (this is done by the schema, but confirm it's toggled on)
4. Copy your **Project URL** and **anon key** from **Settings → API**

### 4. Get Google API keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Custom Search JSON API**
3. Create an API key under **Credentials**
4. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/) → create a new engine → get the **Search Engine ID (CX)**

### 5. Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Mode

The app runs without any API keys configured:

- **No Google keys** → Shows placeholder results and a banner
- **No Supabase** → Shows a local demo feed, no cross-user sharing

Great for hackathon demos even before setup.

---

## Project Structure

```
outcognito/
├── server.js          # Express backend
├── public/
│   ├── index.html     # Single-page frontend
│   ├── style.css      # Dark UI styles
│   └── app.js         # Frontend logic (search, feed, realtime)
├── schema.sql         # Supabase table setup
├── .env.example       # Environment variable template
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/search` | Run a search (saves to DB, returns results) |
| `GET` | `/api/searches` | Fetch recent public searches |
| `GET` | `/api/config` | Returns `{ hasGoogle, hasSupabase }` |
| `GET` | `/api/realtime-config` | Returns Supabase URL + anon key for Realtime |

---

## Privacy Policy

There isn't one.
