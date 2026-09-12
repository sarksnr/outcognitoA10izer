require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Config ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY  || '';
const SUPABASE_URL    = process.env.SUPABASE_URL    || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const hasGemini   = Boolean(GEMINI_API_KEY);
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Gemini client
const ai = hasGemini ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

console.log(`\n🔍 OUTCOGNITO — Search the internet. Everyone is watching.`);
console.log(`   Gemini API : ${hasGemini   ? '✅ configured' : '⚠️  missing — demo mode'}`);
console.log(`   Supabase   : ${hasSupabase ? '✅ configured' : '⚠️  missing — local demo feed'}`);
console.log('');

// ── Demo fallback results ──────────────────────────────────────────────────
const DEMO_RESULTS = [
  {
    title: 'Demo Result — Add your GEMINI_API_KEY to .env to see real results',
    link: '#',
    snippet: 'Set GEMINI_API_KEY in your .env file and restart the server.',
    displayLink: 'outcognito.demo',
  },
  {
    title: 'Get a Gemini API key — Google AI Studio',
    link: 'https://aistudio.google.com/apikey',
    snippet: 'Visit Google AI Studio to generate a free Gemini API key.',
    displayLink: 'aistudio.google.com',
  },
];

// ── Gemini Search (with Google Search grounding) ───────────────────────────
async function geminiSearch(query) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Search the web and return results for: "${query}". List the most relevant web pages with their titles, URLs, and a brief description of each.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const candidate = response?.candidates?.[0];
  const grounding = candidate?.groundingMetadata;

  // Parse grounding chunks — these are the actual search result URLs/titles
  const chunks = grounding?.groundingChunks || [];
  const supports = grounding?.groundingSupports || [];

  // Build results from grounding chunks
  let results = chunks
    .filter((c) => c.web?.uri)
    .map((c) => {
      const uri = c.web.uri;
      let displayLink = '';
      try { displayLink = new URL(uri).hostname; } catch { displayLink = uri; }
      return {
        title: c.web.title || displayLink,
        link: uri,
        snippet: '',
        displayLink,
      };
    });

  // Enrich snippets from the model's text response using grounding supports
  const modelText = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';

  // If we got no grounding chunks, fall back to parsing the text response
  if (results.length === 0 && modelText) {
    results = parseTextResults(modelText, query);
  } else {
    // Attach snippets from supports
    supports.forEach((sup) => {
      const text = sup.segment?.text || '';
      const indices = sup.groundingChunkIndices || [];
      indices.forEach((i) => {
        if (results[i] && !results[i].snippet) {
          results[i].snippet = text.slice(0, 200);
        }
      });
    });

    // Fill empty snippets with model text excerpts
    if (modelText && results.some((r) => !r.snippet)) {
      const sentences = modelText.split(/(?<=[.!?])\s+/);
      results.forEach((r, i) => {
        if (!r.snippet && sentences[i]) r.snippet = sentences[i].slice(0, 200);
      });
    }
  }

  return results.slice(0, 10);
}

// Fallback: parse plain text response into pseudo-results
function parseTextResults(text, query) {
  const lines = text.split('\n').filter((l) => l.trim());
  const results = [];
  for (const line of lines) {
    const urlMatch = line.match(/https?:\/\/[^\s)>\]"]+/);
    if (urlMatch) {
      const uri = urlMatch[0];
      let displayLink = '';
      try { displayLink = new URL(uri).hostname; } catch { displayLink = uri; }
      results.push({
        title: line.replace(urlMatch[0], '').replace(/^[-*#\d.\s]+/, '').trim() || displayLink,
        link: uri,
        snippet: '',
        displayLink,
      });
    }
  }
  if (results.length === 0) {
    // No URLs at all — return the model text as a single "result"
    results.push({
      title: `Gemini answer for: ${query}`,
      link: '#',
      snippet: text.slice(0, 500),
      displayLink: 'gemini.answer',
    });
  }
  return results;
}

// ── Supabase helpers (raw REST — no SDK) ───────────────────────────────────
async function saveSearch(username, query) {
  if (!hasSupabase) return;
  try {
    await axios.post(
      `${SUPABASE_URL}/rest/v1/searches`,
      { username, query },
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      }
    );
  } catch (err) {
    console.error('Supabase insert error:', err.response?.data || err.message);
  }
}

async function getRecentSearches(limit = 30) {
  if (!hasSupabase) return [];
  try {
    const res = await axios.get(
      `${SUPABASE_URL}/rest/v1/searches?select=id,username,query,created_at&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error('Supabase fetch error:', err.response?.data || err.message);
    return [];
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────

// POST /api/search
app.post('/api/search', async (req, res) => {
  const { query, username } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required.' });
  }
  const cleanQuery = query.trim().slice(0, 200);
  const cleanUser  = (username || 'Anonymous').slice(0, 32);

  // Save to Supabase (fire-and-forget)
  saveSearch(cleanUser, cleanQuery);

  let results  = [];
  let demoMode = false;

  if (!hasGemini) {
    demoMode = true;
    results  = DEMO_RESULTS;
  } else {
    try {
      results = await geminiSearch(cleanQuery);
    } catch (err) {
      console.error('Gemini search error:', err.message);
      demoMode = true;
      results  = DEMO_RESULTS;
    }
  }

  return res.json({ results, demoMode });
});

// GET /api/searches
app.get('/api/searches', async (req, res) => {
  const searches = await getRecentSearches(30);
  res.json({ searches, hasSupabase });
});

// GET /api/config
app.get('/api/config', (req, res) => {
  res.json({ hasGemini, hasSupabase });
});

// GET /api/realtime-config
app.get('/api/realtime-config', (req, res) => {
  if (!hasSupabase) return res.status(404).json({ error: 'Supabase not configured.' });
  res.json({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });
});

// Catch-all
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 OUTCOGNITO running at http://localhost:${PORT}\n`);
});
