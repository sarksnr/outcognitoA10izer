/* ================================================================
   OUTCOGNITO — app.js
   Search the internet. Everyone is watching.
   ================================================================ */

'use strict';

// ── Username ──────────────────────────────────────────────────────────────
const USERNAME_KEY = 'outcognito_username';
const ADJECTIVES = [
  'Anonymous', 'Curious', 'Sneaky', 'Mysterious', 'Shadowy',
  'Secretive', 'Wandering', 'Lost', 'Confused', 'Paranoid',
];
const NOUNS = [
  'Cat', 'Goblin', 'Ghost', 'Panda', 'Raccoon',
  'Wizard', 'Penguin', 'Ferret', 'Sloth', 'Gremlin',
];

function generateUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

function getUsername() {
  let name = localStorage.getItem(USERNAME_KEY);
  if (!name) {
    name = generateUsername();
    localStorage.setItem(USERNAME_KEY, name);
  }
  return name;
}

const MY_USERNAME = getUsername();

// ── Outcognito sass ───────────────────────────────────────────────────────
const OUTCOGNITO_LINES = [
  'Bold search.',
  'Your secret is now everyone\'s secret.',
  'Privacy was never an option.',
  'We told you. You searched anyway.',
  'Brave. Very brave.',
  'Someone out there just read that.',
  'No regrets? No refunds.',
  'We\'re just the messenger. And the broadcaster.',
  'Everyone is watching. Hi, everyone.',
  'Your search has been logged, judged, and appreciated.',
  'This has been added to your permanent record.',
  'The internet never forgets. Neither do we.',
  'Classic.',
  'Someone just raised an eyebrow.',
  'A bold choice. We respect it.',
  'Noted. Publicly.',
];

function getRandomLine() {
  return OUTCOGNITO_LINES[Math.floor(Math.random() * OUTCOGNITO_LINES.length)];
}

// ── Demo feed data ────────────────────────────────────────────────────────
const DEMO_SEARCHES = [
  { username: 'SneekyGoblin421', query: 'how to become rich overnight', created_at: new Date(Date.now() - 5000).toISOString() },
  { username: 'CuriousPanda088', query: 'why is my cat staring at the wall', created_at: new Date(Date.now() - 32000).toISOString() },
  { username: 'MysteriousWizard302', query: 'best laptop under 50000', created_at: new Date(Date.now() - 78000).toISOString() },
  { username: 'ParanoidRaccoon771', query: 'is my phone listening to me', created_at: new Date(Date.now() - 140000).toISOString() },
  { username: 'LostSloth994', query: 'how to pass tomorrow\'s exam without studying', created_at: new Date(Date.now() - 210000).toISOString() },
  { username: 'ShadowyFerret255', query: 'signs your boss hates you', created_at: new Date(Date.now() - 360000).toISOString() },
];

// ── DOM refs ──────────────────────────────────────────────────────────────
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const btnSpinner = document.getElementById('btnSpinner');
const btnText = searchBtn.querySelector('.btn-text');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const resultsList = document.getElementById('resultsList');
const outcognitoSays = document.getElementById('outcognitoSays');
const saysQuote = document.getElementById('saysQuote');
const demoBanner = document.getElementById('demo-banner');
const sidebarNoSupabase = document.getElementById('sidebarNoSupabase');
const feed = document.getElementById('feed');
const liveCount = document.getElementById('liveCount');
const footerUsername = document.getElementById('footerUsername');

// ── Init ──────────────────────────────────────────────────────────────────
footerUsername.textContent = MY_USERNAME;

let hasSupabase = false;
let supabaseClient = null;
let feedItems = []; // [{id, username, query, created_at}]

async function init() {
  // 1. Check server config
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    hasSupabase = cfg.hasSupabase;

    if (!cfg.hasGemini) {
      demoBanner.classList.remove('hidden');
    }
  } catch {
    // server might be starting — silently continue
  }

  // 2. Load recent searches
  await loadRecentSearches();

  // 3. Set up Supabase Realtime if available
  if (hasSupabase) {
    setupRealtime();
  } else {
    sidebarNoSupabase.classList.remove('hidden');
  }
}

// ── Recent searches (initial load) ───────────────────────────────────────
async function loadRecentSearches() {
  try {
    const res = await fetch('/api/searches');
    const data = await res.json();
    hasSupabase = data.hasSupabase;

    if (data.searches && data.searches.length > 0) {
      feedItems = data.searches;
      renderFeed();
    } else if (!hasSupabase) {
      // Show demo feed
      feedItems = DEMO_SEARCHES;
      renderFeed();
    } else {
      showFeedEmpty();
    }
  } catch {
    // Fallback to demo
    feedItems = DEMO_SEARCHES;
    renderFeed();
  }
}

// ── Supabase Realtime ─────────────────────────────────────────────────────
async function setupRealtime() {
  // We load Supabase JS from CDN only when needed
  // The SUPABASE_URL and ANON_KEY are never in frontend code
  // We poll the backend's SSE or use supabase.js with the public anon key
  // For Realtime to work, we need the supabase URL and anon key on the frontend
  // (anon key is safe to expose — it's like an "API key for public data")
  // We fetch them from the server as a one-time config call

  try {
    const res = await fetch('/api/realtime-config');
    if (!res.ok) return;
    const { url, anonKey } = await res.json();
    if (!url || !anonKey) return;

    // Dynamically load Supabase JS
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');

    supabaseClient = window.supabase.createClient(url, anonKey);

    supabaseClient
      .channel('public:searches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'searches' },
        (payload) => {
          const newRow = payload.new;
          prependFeedItem(newRow);
        }
      )
      .subscribe();

  } catch (err) {
    console.warn('Realtime setup failed:', err.message);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Feed rendering ────────────────────────────────────────────────────────
function renderFeed() {
  feed.innerHTML = '';
  if (feedItems.length === 0) {
    showFeedEmpty();
    return;
  }
  feedItems.forEach((item) => {
    feed.appendChild(buildFeedEl(item));
  });
  liveCount.textContent = feedItems.length;
}

function prependFeedItem(item) {
  // Avoid duplicates
  if (feedItems.find((i) => i.id === item.id)) return;

  feedItems.unshift(item);
  if (feedItems.length > 50) feedItems.pop();

  const el = buildFeedEl(item);
  feed.insertBefore(el, feed.firstChild);
  liveCount.textContent = feedItems.length;

  // Remove empty state if present
  const empty = feed.querySelector('.feed-empty');
  if (empty) empty.remove();
}

function buildFeedEl(item) {
  const isMe = item.username === MY_USERNAME;
  const div = document.createElement('div');
  div.className = `feed-item${isMe ? ' is-me' : ''}`;

  div.innerHTML = `
    <div class="feed-user">
      ${escHtml(item.username)}
      ${isMe ? '<span class="feed-me-badge">you</span>' : ''}
    </div>
    <div class="feed-query">${escHtml(item.query)}</div>
    <div class="feed-time">${timeAgo(item.created_at)}</div>
  `;
  return div;
}

function showFeedEmpty() {
  feed.innerHTML = `
    <div class="feed-empty">
      👁 No searches yet.<br>
      Be the first.<br>
      <span style="color:var(--text-dimmer);font-size:0.75rem;">
        (Everyone will see it.)
      </span>
    </div>
  `;
}

// Periodically refresh timestamps
setInterval(() => {
  const timeEls = feed.querySelectorAll('.feed-time');
  timeEls.forEach((el, i) => {
    if (feedItems[i]) el.textContent = timeAgo(feedItems[i].created_at);
  });
}, 15000);

// ── Search form ───────────────────────────────────────────────────────────
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  setLoading(true);

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, username: MY_USERNAME }),
    });
    const data = await res.json();

    if (data.demoMode) {
      demoBanner.classList.remove('hidden');
    }

    renderResults(data.results, query);
    showOutcognitoSays();

    // If Supabase is not configured, manually add to local feed
    if (!hasSupabase) {
      prependFeedItem({
        id: Date.now(),
        username: MY_USERNAME,
        query,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    showError('Something went wrong. ' + err.message);
  } finally {
    setLoading(false);
  }
});

// ── Results rendering ─────────────────────────────────────────────────────
function renderResults(results, query) {
  resultsPlaceholder.classList.add('hidden');
  resultsList.classList.remove('hidden');
  resultsList.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'result-header';
  header.innerHTML = `Search results for: <span style="color:var(--text)">"${escHtml(query)}"</span>`;
  resultsList.appendChild(header);

  if (!results || results.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:32px 0; color:var(--text-dimmer); text-align:center;';
    empty.textContent = 'No results found.';
    resultsList.appendChild(empty);
    return;
  }

  results.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const faviconUrl = r.link && r.link !== '#'
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(r.displayLink)}&sz=16`
      : '';

    card.innerHTML = `
      <div class="result-url">
        ${faviconUrl ? `<img class="result-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        ${escHtml(r.displayLink || r.link)}
      </div>
      <a class="result-title" href="${escAttr(r.link)}" target="_blank" rel="noopener">
        ${escHtml(r.title)}
      </a>
      <p class="result-snippet">${escHtml(r.snippet || '')}</p>
    `;
    resultsList.appendChild(card);
  });
}

// ── Outcognito says ───────────────────────────────────────────────────────
function showOutcognitoSays() {
  saysQuote.textContent = getRandomLine();
  outcognitoSays.classList.remove('hidden');
  // re-trigger animation
  outcognitoSays.style.animation = 'none';
  void outcognitoSays.offsetHeight;
  outcognitoSays.style.animation = '';
}

// ── Loading state ─────────────────────────────────────────────────────────
function setLoading(on) {
  searchBtn.disabled = on;
  searchInput.disabled = on;
  if (on) {
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
  }
}

// ── Error display ─────────────────────────────────────────────────────────
function showError(msg) {
  resultsPlaceholder.classList.add('hidden');
  resultsList.classList.remove('hidden');
  resultsList.innerHTML = `
    <div style="padding:32px 0; color:#ff6b6b; text-align:center;">
      ⚠ ${escHtml(msg)}
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  if (!str) return '#';
  // Allow only http/https
  if (/^https?:\/\//i.test(str)) return str;
  return '#';
}

function timeAgo(isoString) {
  const then = new Date(isoString).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 5)  return 'just now';
  if (diff < 60) return `${diff} sec ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Go ────────────────────────────────────────────────────────────────────
init();
