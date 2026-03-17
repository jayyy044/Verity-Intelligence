const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { callA, callB, fillGaps } = require('./research/exaSearches');
const { detectGaps } = require('./research/gapDetector');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────────────────────
// Cache setup — two folders: exa/ and results/
// Created on server start if they don't exist
// ─────────────────────────────────────────────────────────────

const CACHE_DIR = path.join(__dirname, '.cache');
const EXA_CACHE_DIR = path.join(CACHE_DIR, 'exa');
const RESULT_CACHE_DIR = path.join(CACHE_DIR, 'results');

[CACHE_DIR, EXA_CACHE_DIR, RESULT_CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
console.log('[Cache] exa/ and results/ directories ready');

function getCacheKey(company, descriptor) {
  return `${company}_${descriptor || 'no-descriptor'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.json';
}

function readExaCache(company, descriptor) {
  const file = path.join(EXA_CACHE_DIR, getCacheKey(company, descriptor));
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`[Exa Cache] HIT — ${path.basename(file)}`);
    return data;
  } catch {
    console.log(`[Exa Cache] Read error — ${path.basename(file)}`);
    return null;
  }
}

function writeExaCache(company, descriptor, data) {
  const file = path.join(EXA_CACHE_DIR, getCacheKey(company, descriptor));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[Exa Cache] SAVED — ${path.basename(file)}`);
}

function readResultCache(company, descriptor) {
  const file = path.join(RESULT_CACHE_DIR, getCacheKey(company, descriptor));
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`[Result Cache] HIT — ${path.basename(file)}`);
    return data;
  } catch {
    console.log(`[Result Cache] Read error — ${path.basename(file)}`);
    return null;
  }
}

function writeResultCache(company, descriptor, data) {
  const file = path.join(RESULT_CACHE_DIR, getCacheKey(company, descriptor));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[Result Cache] SAVED — ${path.basename(file)}`);
}

// ─────────────────────────────────────────────────────────────
// SSE helper
// ─────────────────────────────────────────────────────────────

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
// POST /research/stream — SSE pipeline
// Steps:
//   0 — Initializing research pipeline
//   1 — Searching company profile & business model
//   2 — Mapping competitive landscape
//   3 — Identifying ecosystem relationships
//   4 — Scanning news & sentiment signals
//   5 — Checking for research gaps
//   6 — Filling gaps (only fires if gaps found)
//   7 — Research complete, ready for synthesis
//   done — final data payload
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
    send(res, { step: 0 }); // Initializing research pipeline

    // ── Check result cache first — skip everything if hit ──
    const cachedResult = readResultCache(company, descriptor);

    if (cachedResult) {
      console.log('[Stream] Result cache hit — skipping full pipeline');
      send(res, { step: 1 }); await sleep(150);
      send(res, { step: 2 }); await sleep(150);
      send(res, { step: 3 }); await sleep(150);
      send(res, { step: 4 }); await sleep(150);
      send(res, { step: 5 }); await sleep(150);
      send(res, { step: 7 });
      send(res, { step: 'done', data: cachedResult, served_from_cache: 'result' });
      res.end();
      return;
    }

    // ── Phase 1 — Exa retrieval (check exa cache first) ───
    let commercialData, signalsData;
    const cachedExa = readExaCache(company, descriptor);

    if (cachedExa) {
      console.log('[Stream] Exa cache hit — skipping Exa calls');
      commercialData = cachedExa.commercialData;
      signalsData = cachedExa.signalsData;

      send(res, { step: 1 }); await sleep(150);
      send(res, { step: 2 }); await sleep(150);
      send(res, { step: 3 }); await sleep(150);
      send(res, { step: 4 }); await sleep(150);
    } else {
      console.log('[Stream] Exa cache miss — running parallel retrieval');

      send(res, { step: 1 }); // Searching company profile
      const callAPromise = callA(company, descriptor);

      send(res, { step: 2 }); // Mapping competitive landscape
      const callBPromise = callB(company, descriptor);

      [commercialData, signalsData] = await Promise.all([callAPromise, callBPromise]);

      send(res, { step: 3 }); // Identifying ecosystem relationships
      await sleep(100);
      send(res, { step: 4 }); // Scanning news & sentiment

      writeExaCache(company, descriptor, { commercialData, signalsData });
    }

    // ── Phase 2 — Gap detection ────────────────────────────
    send(res, { step: 5 }); // Checking for research gaps
    const gapResult = await detectGaps(company, commercialData, signalsData);
    // const gapResult = []

    // ── Phase 3 — Gap fill (conditional) ──────────────────
    let gapData = [];

    if (gapResult.gaps.length > 0) {
      send(res, { step: 6 }); // Filling gaps
      console.log(`[Stream] Filling ${gapResult.gaps.length} gap(s)...`);
      gapData = await fillGaps(gapResult.gaps);
    } else {
      console.log('[Stream] No gaps detected — skipping gap fill');
    }

    send(res, { step: 7 }); // Research complete, ready for synthesis

    // ── Build pipeline output ──────────────────────────────
    // Claude synthesis will be added here next
    // For now, return the full raw research data
    const pipelineOutput = {
      status: 'exa_complete',
      company,
      descriptor: descriptor || null,
      gap_detection: {
        gaps_found: gapResult.gaps.length,
        gaps: gapResult.gaps,
        confidence: gapResult.confidence,
        notes: gapResult.notes,
      },
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
          ecosystem: {
            count: commercialData.ecosystem?.results.length || 0,
            results: (commercialData.ecosystem?.results || []).map(r => ({
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
        gapFill: {
          count: gapData.length,
          results: gapData.map((r, i) => ({
            query: gapResult.gaps[i],
            count: r.results?.length || 0,
            results: (r.results || []).map(x => ({
              title: x.title,
              url: x.url,
              preview: x.text?.slice(0, 200),
            })),
          })),
        },
      },
    };

    // NOTE: once Claude synthesis is added, save to result cache here:
    // writeResultCache(company, descriptor, finalIntelligenceReport);

    send(res, { step: 'done', data: pipelineOutput, served_from_cache: false });
    res.end();

  } catch (error) {
    console.error('[Stream] Error:', error.message);
    send(res, { step: 'error', message: error.message });
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});