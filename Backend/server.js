const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { callA, callB } = require('./research/exaSearches');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────────────────────
// Cache setup
// ─────────────────────────────────────────────────────────────

const CACHE_DIR = path.join(__dirname, '.cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log('[Cache] Created .cache directory');
} else {
  console.log('[Cache] .cache directory ready');
}

function getCacheKey(company, descriptor) {
  const key = `${company}_${descriptor || 'no-descriptor'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return path.join(CACHE_DIR, `${key}.json`);
}

function readCache(company, descriptor) {
  const file = getCacheKey(company, descriptor);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`[Cache] HIT — ${path.basename(file)}`);
    return data;
  } catch {
    console.log(`[Cache] Read error — ${path.basename(file)}`);
    return null;
  }
}

function writeCache(company, descriptor, data) {
  const file = getCacheKey(company, descriptor);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[Cache] SAVED — ${path.basename(file)}`);
}

function send(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'Verity backend is running' });
});

// ─────────────────────────────────────────────────────────────
// POST /research/stream — SSE, Exa only
// ─────────────────────────────────────────────────────────────

app.post('/research/stream', async (req, res) => {
  const { company, descriptor } = req.body;

  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    send(res, { step: 0 }); // "Initializing research pipeline"

    const cached = readCache(company, descriptor);

    if (cached) {
      console.log('[Stream] Cache hit — skipping Exa');
      send(res, { step: 1 }); await sleep(200);
      send(res, { step: 2 }); await sleep(200);
      send(res, { step: 3 }); await sleep(200);
      send(res, { step: 4 }); await sleep(200);
      send(res, { step: 'done', data: cached });
      res.end();
      return;
    }

    // Cache miss — fire both Exa calls in parallel
    send(res, { step: 1 }); // "Searching company profile & business model"
    const callAPromise = callA(company, descriptor);

    send(res, { step: 2 }); // "Mapping competitive landscape"
    const callBPromise = callB(company, descriptor);

    const [commercialData, signalsData] = await Promise.all([callAPromise, callBPromise]);

    send(res, { step: 3 }); // "Identifying ecosystem relationships"
    await sleep(150);
    send(res, { step: 4 }); // "Scanning news & sentiment signals"

    const result = { commercialData, signalsData };
    writeCache(company, descriptor, result);

    send(res, { step: 'done', data: result });
    res.end();

  } catch (error) {
    console.error('[Stream] Error:', error.message);
    send(res, { step: 'error', message: error.message });
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────
// POST /research — original endpoint (keep for testing)
// ─────────────────────────────────────────────────────────────

app.post('/research', async (req, res) => {
  const { company, descriptor } = req.body;

  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`New research request: ${company} ${descriptor || ''}`);
  console.log(`${'='.repeat(50)}`);

  try {
    const startTime = Date.now();
    let commercialData, signalsData;
    let servedFromCache = false;

    const cached = readCache(company, descriptor);

    if (cached) {
      commercialData = cached.commercialData;
      signalsData = cached.signalsData;
      servedFromCache = true;
      console.log('[Pipeline] Served from cache');
    } else {
      [commercialData, signalsData] = await Promise.all([
        callA(company, descriptor),
        callB(company, descriptor),
      ]);
      writeCache(company, descriptor, { commercialData, signalsData });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return res.json({
      status: 'exa_complete',
      company,
      descriptor: descriptor || null,
      elapsed_seconds: elapsed,
      served_from_cache: servedFromCache,
      results: {
        callA: {
          companyProfile: {
            count: commercialData.companyProfile.results.length,
            results: commercialData.companyProfile.results.map(r => ({
              title: r.title,
              url: r.url,
              preview: r.text?.slice(0, 300),
            })),
          },
          competitors: {
            count: commercialData.competitors.results.length,
            results: commercialData.competitors.results.map(r => ({
              title: r.title,
              url: r.url,
              preview: r.text?.slice(0, 200),
            })),
          },
          funding: {
            count: commercialData.funding.results.length,
            results: commercialData.funding.results.map(r => ({
              title: r.title,
              url: r.url,
              preview: r.text?.slice(0, 200),
            })),
          },
        },
        callB: {
          news: {
            count: signalsData.news.results.length,
            results: signalsData.news.results.map(r => ({
              title: r.title,
              url: r.url,
              published: r.publishedDate?.slice(0, 10),
              highlights: r.highlights,
              preview: r.text?.slice(0, 200),
            })),
          },
          founders: {
            count: signalsData.founders.results.length,
            results: signalsData.founders.results.map(r => ({
              title: r.title,
              url: r.url,
              preview: r.text?.slice(0, 300),
            })),
          },
        },
      },
    });

  } catch (error) {
    console.error('[Pipeline] Error:', error.message);
    return res.status(500).json({ error: 'Research pipeline failed', detail: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});