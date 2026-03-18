const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { callA, callB, fillGaps } = require('./research/exaSearches');
const { detectGaps }             = require('./research/gapDetector');
const { synthesize }             = require('./research/synthesizer');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────────────────────
// CACHE SETUP
// Three folders, checked in priority order:
//
//   1. .cache/synthesizedOutput/  ← full final report (skip everything)
//   2. .cache/results/            ← raw Exa + gap data (skip Exa, run synthesizer)
//   3. .cache/exa/                ← raw Exa only (skip Exa, run gap + synthesizer)
//
// Created on server start if they don't exist.
// ─────────────────────────────────────────────────────────────

const CACHE_DIR            = path.join(__dirname, '.cache');
const SYNTHESIZED_CACHE    = path.join(CACHE_DIR, 'synthesizedOutput');
const RESULT_CACHE_DIR     = path.join(CACHE_DIR, 'results');
const EXA_CACHE_DIR        = path.join(CACHE_DIR, 'exa');

[CACHE_DIR, SYNTHESIZED_CACHE, RESULT_CACHE_DIR, EXA_CACHE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
console.log('[Cache] synthesizedOutput/, results/, exa/ directories ready');

// ─────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────

function getCacheKey(company, descriptor) {
  return `${company}_${descriptor || 'no-descriptor'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.json';
}

function readCache(dir, company, descriptor) {
  const file = path.join(dir, getCacheKey(company, descriptor));
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`[Cache] HIT — ${path.relative(CACHE_DIR, file)}`);
    return data;
  } catch {
    console.log(`[Cache] Read error — ${path.relative(CACHE_DIR, file)}`);
    return null;
  }
}

function writeCache(dir, company, descriptor, data) {
  const file = path.join(dir, getCacheKey(company, descriptor));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[Cache] SAVED — ${path.relative(CACHE_DIR, file)}`);
}

// ─────────────────────────────────────────────────────────────
// SSE HELPERS
// ─────────────────────────────────────────────────────────────

function send(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────
// STEP LABELS (for frontend loading UI)
//   0 — Initializing research pipeline
//   1 — Searching company profile & business model
//   2 — Mapping competitive landscape
//   3 — Identifying ecosystem relationships
//   4 — Scanning news & sentiment signals
//   5 — Checking for research gaps
//   6 — Filling research gaps
//   7 — Research complete, preparing synthesis
//   8 — Synthesizing intelligence brief
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ message: 'Verity backend is running' });
});

// ─────────────────────────────────────────────────────────────
// POST /research/stream — main SSE pipeline
//
// Cache check order:
//   TIER 1: synthesizedOutput cache → return immediately, skip all steps
//   TIER 2: results cache → skip Exa + gap detection, jump to synthesizer
//   TIER 3: exa cache → skip Exa calls, run gap detection + synthesizer
//   MISS:   run full pipeline from scratch
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

    // ── TIER 1: Synthesized output cache ──────────────────────
    // Full final report already exists — skip everything
    const cachedSynthesized = readCache(SYNTHESIZED_CACHE, company, descriptor);

    if (cachedSynthesized) {
      console.log('[Stream] Synthesized cache hit — returning final report immediately');
      for (let step = 1; step <= 8; step++) {
        send(res, { step });
        await sleep(80);
      }
      send(res, {
        step: 'done',
        data: cachedSynthesized,
        served_from_cache: 'synthesizedOutput',
      });
      res.end();
      return;
    }

    // ── TIER 2: Results cache ──────────────────────────────────
    // Raw Exa + gap data exists — skip straight to synthesizer
    const cachedResults = readCache(RESULT_CACHE_DIR, company, descriptor);

    if (cachedResults) {
      console.log('[Stream] Results cache hit — skipping Exa + gap detection, running synthesizer');
      for (let step = 1; step <= 7; step++) {
        send(res, { step });
        await sleep(80);
      }

      send(res, { step: 8 }); // Synthesizing intelligence brief
      const intelligenceReport = await synthesize(company, cachedResults);

      const finalOutput = {
        ...cachedResults,
        status: 'complete',
        intelligence_report: intelligenceReport,
      };

      writeCache(SYNTHESIZED_CACHE, company, descriptor, finalOutput);

      send(res, {
        step: 'done',
        data: finalOutput,
        served_from_cache: 'results',
      });
      res.end();
      return;
    }

    // ── TIER 3: Exa cache ──────────────────────────────────────
    // Raw Exa results exist — skip Exa calls, run gap detection + synthesizer
    let commercialData, signalsData;
    const cachedExa = readCache(EXA_CACHE_DIR, company, descriptor);

    if (cachedExa) {
      console.log('[Stream] Exa cache hit — skipping Exa calls, running gap detection + synthesizer');
      commercialData = cachedExa.commercialData;
      signalsData    = cachedExa.signalsData;

      for (let step = 1; step <= 4; step++) {
        send(res, { step });
        await sleep(80);
      }

    } else {
      // ── FULL MISS: Run Exa from scratch ─────────────────────
      console.log('[Stream] No cache — running full pipeline');

      send(res, { step: 1 }); // Searching company profile & business model
      const callAPromise = callA(company, descriptor);

      send(res, { step: 2 }); // Mapping competitive landscape
      const callBPromise = callB(company, descriptor);

      [commercialData, signalsData] = await Promise.all([callAPromise, callBPromise]);

      send(res, { step: 3 }); // Identifying ecosystem relationships
      send(res, { step: 4 }); // Scanning news & sentiment signals

      writeCache(EXA_CACHE_DIR, company, descriptor, { commercialData, signalsData });
    }

    // ── Gap detection (always runs if no results cache) ───────
    send(res, { step: 5 }); // Checking for research gaps
    const gapResult = await detectGaps(company, commercialData, signalsData);

    // ── Gap fill (conditional) ────────────────────────────────
    let gapData = [];

    if (gapResult.gaps.length > 0) {
      send(res, { step: 6 }); // Filling research gaps
      console.log(`[Stream] Filling ${gapResult.gaps.length} gap(s)...`);
      gapData = await fillGaps(gapResult.gaps);
    } else {
      console.log('[Stream] No gaps — skipping gap fill');
    }

    send(res, { step: 7 }); // Research complete, preparing synthesis

    // ── Assemble pipeline bundle ──────────────────────────────
    const pipelineOutput = {
      status: 'exa_complete',
      company,
      descriptor: descriptor || null,
      gap_detection: {
        gaps_found: gapResult.gaps.length,
        gaps:       gapResult.gaps,
        confidence: gapResult.confidence,
        notes:      gapResult.notes,
      },
      results: {
        callA: {
          companyProfile: {
            count:   commercialData.companyProfile.results.length,
            results: commercialData.companyProfile.results.map(r => ({
              title:   r.title,
              url:     r.url,
              preview: r.text,
            })),
          },
          competitors: {
            count:   commercialData.competitors.results.length,
            results: commercialData.competitors.results.map(r => ({
              title:   r.title,
              url:     r.url,
              preview: r.text,
            })),
          },
          funding: {
            count:   commercialData.funding.results.length,
            results: commercialData.funding.results.map(r => ({
              title:   r.title,
              url:     r.url,
              preview: r.text, // more text — highest hallucination risk
            })),
          },
          ecosystem: {
            count:   commercialData.ecosystem?.results.length || 0,
            results: (commercialData.ecosystem?.results || []).map(r => ({
              title:   r.title,
              url:     r.url,
              preview: r.text,
            })),
          },
        },
        callB: {
          news: {
            count:   signalsData.news.results.length,
            results: signalsData.news.results.map(r => ({
              title:      r.title,
              url:        r.url,
              published:  r.publishedDate?.slice(0, 20),
              highlights: r.highlights,
              preview:    r.text,
            })),
          },
          founders: {
            count:   signalsData.founders.results.length,
            results: signalsData.founders.results.map(r => ({
              title:   r.title,
              url:     r.url,
              preview: r.text,
            })),
          },
        },
        gapFill: {
          count:   gapData.length,
          results: gapData.map((r, i) => ({
            query:   gapResult.gaps[i],
            count:   r.results?.length || 0,
            results: (r.results || []).map(x => ({
              title:   x.title,
              url:     x.url,
              preview: x.text,
            })),
          })),
        },
      },
    };

    // Save results cache before synthesizing
    // This way if synthesis fails, the next request can resume from here
    writeCache(RESULT_CACHE_DIR, company, descriptor, pipelineOutput);
    send(res, { step: 8 });
    // ── Synthesizer ───────────────────────────────────────────
    const intelligenceReport = await synthesize(company, pipelineOutput);

    const finalOutput = {
      ...pipelineOutput,
      status: 'complete',
      intelligence_report: intelligenceReport,
    };
 
    // Save to synthesized cache — this is what future requests will hit first
    writeCache(SYNTHESIZED_CACHE, company, descriptor, finalOutput);

    send(res, {
      step: 'done',
      data: finalOutput,
      served_from_cache: false,
    });
    res.end();

  } catch (error) {
    console.error('[Stream] Pipeline error:', error.message);
    send(res, { step: 'error', message: error.message });
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /cache — clear cache for a specific company
// Body: { company, descriptor? }
// Useful during development or when forcing a re-research
// ─────────────────────────────────────────────────────────────

app.delete('/cache', (req, res) => {
  const { company, descriptor } = req.body;

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const key = getCacheKey(company, descriptor);
  const targets = [
    path.join(SYNTHESIZED_CACHE, key),
    path.join(RESULT_CACHE_DIR, key),
    path.join(EXA_CACHE_DIR, key),
  ];

  const deleted = [];
  targets.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      deleted.push(path.relative(CACHE_DIR, file));
    }
  });

  console.log(`[Cache] Cleared for "${company}": ${deleted.length} file(s) deleted`);
  res.json({ cleared: deleted, company, descriptor: descriptor || null });
});

// ─────────────────────────────────────────────────────────────
// GET /cache — list what's cached (useful for debugging)
// ─────────────────────────────────────────────────────────────

app.get('/cache', (req, res) => {
  const list = (dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      : [];

  res.json({
    synthesizedOutput: list(SYNTHESIZED_CACHE),
    results:           list(RESULT_CACHE_DIR),
    exa:               list(EXA_CACHE_DIR),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});