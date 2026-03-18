// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
// require('dotenv').config();

// const { runAllSearches, fillGaps } = require('./research/exaSearches');
// const { filterNoise } = require('./research/filterNoise')
// const { detectGaps }             = require('./research/gapDetector');
// const { synthesize }             = require('./research/synthesizer');

// const app = express();
// app.use(express.json());
// app.use(cors());

// // ─────────────────────────────────────────────────────────────
// // CACHE SETUP
// // Three folders, checked in priority order:
// //
// //   1. .cache/synthesizedOutput/  ← full final report (skip everything)
// //   2. .cache/results/            ← raw Exa + gap data (skip Exa, run synthesizer)
// //   3. .cache/exa/                ← raw Exa only (skip Exa, run gap + synthesizer)
// //
// // Created on server start if they don't exist.
// // ─────────────────────────────────────────────────────────────

// const CACHE_DIR            = path.join(__dirname, '.cache');
// const SYNTHESIZED_CACHE    = path.join(CACHE_DIR, 'synthesizedOutput');
// const RESULT_CACHE_DIR     = path.join(CACHE_DIR, 'results');
// const EXA_CACHE_DIR        = path.join(CACHE_DIR, 'exa');

// [CACHE_DIR, SYNTHESIZED_CACHE, RESULT_CACHE_DIR, EXA_CACHE_DIR].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });
// console.log('[Cache] synthesizedOutput/, results/, exa/ directories ready');

// // ─────────────────────────────────────────────────────────────
// // CACHE HELPERS
// // ─────────────────────────────────────────────────────────────

// function getCacheKey(company, descriptor) {
//   return `${company}_${descriptor || 'no-descriptor'}`
//     .toLowerCase()
//     .replace(/\s+/g, '-')
//     .replace(/[^a-z0-9-]/g, '') + '.json';
// }

// function readCache(dir, company, descriptor) {
//   const file = path.join(dir, getCacheKey(company, descriptor));
//   if (!fs.existsSync(file)) return null;
//   try {
//     const data = JSON.parse(fs.readFileSync(file, 'utf8'));
//     console.log(`[Cache] HIT — ${path.relative(CACHE_DIR, file)}`);
//     return data;
//   } catch {
//     console.log(`[Cache] Read error — ${path.relative(CACHE_DIR, file)}`);
//     return null;
//   }
// }

// function writeCache(dir, company, descriptor, data) {
//   const file = path.join(dir, getCacheKey(company, descriptor));
//   fs.writeFileSync(file, JSON.stringify(data, null, 2));
//   console.log(`[Cache] SAVED — ${path.relative(CACHE_DIR, file)}`);
// }

// // ─────────────────────────────────────────────────────────────
// // SSE HELPERS
// // ─────────────────────────────────────────────────────────────

// function send(res, event) {
//   res.write(`data: ${JSON.stringify(event)}\n\n`);
// }

// function sleep(ms) {
//   return new Promise(r => setTimeout(r, ms));
// }

// // ─────────────────────────────────────────────────────────────
// // STEP LABELS (for frontend loading UI)
// //   0 — Initializing research pipeline
// //   1 — Searching company profile & business model
// //   2 — Mapping competitive landscape
// //   3 — Identifying ecosystem relationships
// //   4 — Scanning news & sentiment signals
// //   5 — Checking for research gaps
// //   6 — Filling research gaps
// //   7 — Research complete, preparing synthesis
// //   8 — Synthesizing intelligence brief
// // ─────────────────────────────────────────────────────────────

// // ─────────────────────────────────────────────────────────────
// // HEALTH CHECK
// // ─────────────────────────────────────────────────────────────

// app.get('/', (req, res) => {
//   res.json({ message: 'Verity backend is running' });
// });

// // ─────────────────────────────────────────────────────────────
// // POST /research/stream — main SSE pipeline
// //
// // Cache check order:
// //   TIER 1: synthesizedOutput cache → return immediately, skip all steps
// //   TIER 2: results cache → skip Exa + gap detection, jump to synthesizer
// //   TIER 3: exa cache → skip Exa calls, run gap detection + synthesizer
// //   MISS:   run full pipeline from scratch
// // ─────────────────────────────────────────────────────────────

// // app.post('/research/stream', async (req, res) => {
// //   const { company, descriptor } = req.body;

// //   if (!company || company.trim() === '') {
// //     return res.status(400).json({ error: 'Company name is required' });
// //   }

// //   res.setHeader('Content-Type', 'text/event-stream');
// //   res.setHeader('Cache-Control', 'no-cache');
// //   res.setHeader('Connection', 'keep-alive');
// //   res.flushHeaders();

// //   try {
// //     send(res, { step: 0 }); // Initializing research pipeline

// //     // ── TIER 1: Synthesized output cache ──────────────────────
// //     // Full final report already exists — skip everything
// //     const cachedSynthesized = readCache(SYNTHESIZED_CACHE, company, descriptor);

// //     if (cachedSynthesized) {
// //       console.log('[Stream] Synthesized cache hit — returning final report immediately');
// //       for (let step = 1; step <= 8; step++) {
// //         send(res, { step });
// //         await sleep(80);
// //       }
// //       send(res, {
// //         step: 'done',
// //         data: cachedSynthesized,
// //         served_from_cache: 'synthesizedOutput',
// //       });
// //       res.end();
// //       return;
// //     }

// //     // ── TIER 2: Results cache ──────────────────────────────────
// //     // Raw Exa + gap data exists — skip straight to synthesizer
// //     const cachedResults = readCache(RESULT_CACHE_DIR, company, descriptor);

// //     if (cachedResults) {
// //       console.log('[Stream] Results cache hit — skipping Exa + gap detection, running synthesizer');
// //       for (let step = 1; step <= 7; step++) {
// //         send(res, { step });
// //         await sleep(80);
// //       }

// //       send(res, { step: 8 }); // Synthesizing intelligence brief
// //       const intelligenceReport = await synthesize(company, cachedResults);

// //       const finalOutput = {
// //         ...cachedResults,
// //         status: 'complete',
// //         intelligence_report: intelligenceReport,
// //       };

// //       writeCache(SYNTHESIZED_CACHE, company, descriptor, finalOutput);

// //       send(res, {
// //         step: 'done',
// //         data: finalOutput,
// //         served_from_cache: 'results',
// //       });
// //       res.end();
// //       return;
// //     }

// //     // ── TIER 3: Exa cache ──────────────────────────────────────
// //     // Raw Exa results exist — skip Exa calls, run gap detection + synthesizer
// //     let commercialData, signalsData;
// //     const cachedExa = readCache(EXA_CACHE_DIR, company, descriptor);

// //     if (cachedExa) {
// //       console.log('[Stream] Exa cache hit — skipping Exa calls, running gap detection + synthesizer');
// //       commercialData = cachedExa.commercialData;
// //       signalsData    = cachedExa.signalsData;

// //       for (let step = 1; step <= 4; step++) {
// //         send(res, { step });
// //         await sleep(80);
// //       }

// //     } else {
// //       // ── FULL MISS: Run Exa from scratch ─────────────────────
// //       console.log('[Stream] No cache — running full pipeline');

// //       send(res, { step: 1 }); // Searching company profile & business model
// //       const callAPromise = callA(company, descriptor);

// //       send(res, { step: 2 }); // Mapping competitive landscape
// //       const callBPromise = callB(company, descriptor);

// //       [commercialData, signalsData] = await Promise.all([callAPromise, callBPromise]);

// //       send(res, { step: 3 }); // Identifying ecosystem relationships
// //       send(res, { step: 4 }); // Scanning news & sentiment signals

// //       writeCache(EXA_CACHE_DIR, company, descriptor, { commercialData, signalsData });
// //     }

// //     // ── Gap detection (always runs if no results cache) ───────
// //     send(res, { step: 5 }); // Checking for research gaps
// //     const gapResult = await detectGaps(company, commercialData, signalsData);

// //     // ── Gap fill (conditional) ────────────────────────────────
// //     let gapData = [];

// //     if (gapResult.gaps.length > 0) {
// //       send(res, { step: 6 }); // Filling research gaps
// //       console.log(`[Stream] Filling ${gapResult.gaps.length} gap(s)...`);
// //       gapData = await fillGaps(gapResult.gaps);
// //     } else {
// //       console.log('[Stream] No gaps — skipping gap fill');
// //     }

// //     send(res, { step: 7 }); // Research complete, preparing synthesis

// //     // ── Assemble pipeline bundle ──────────────────────────────
// //     const pipelineOutput = {
// //       status: 'exa_complete',
// //       company,
// //       descriptor: descriptor || null,
// //       gap_detection: {
// //         gaps_found: gapResult.gaps.length,
// //         gaps:       gapResult.gaps,
// //         confidence: gapResult.confidence,
// //         notes:      gapResult.notes,
// //       },
// //       results: {
// //         callA: {
// //           companyProfile: {
// //             count:   commercialData.companyProfile.results.length,
// //             results: commercialData.companyProfile.results.map(r => ({
// //               title:   r.title,
// //               url:     r.url,
// //               preview: r.text,
// //             })),
// //           },
// //           competitors: {
// //             count:   commercialData.competitors.results.length,
// //             results: commercialData.competitors.results.map(r => ({
// //               title:   r.title,
// //               url:     r.url,
// //               preview: r.text,
// //             })),
// //           },
// //           funding: {
// //             count:   commercialData.funding.results.length,
// //             results: commercialData.funding.results.map(r => ({
// //               title:   r.title,
// //               url:     r.url,
// //               preview: r.text, // more text — highest hallucination risk
// //             })),
// //           },
// //           ecosystem: {
// //             count:   commercialData.ecosystem?.results.length || 0,
// //             results: (commercialData.ecosystem?.results || []).map(r => ({
// //               title:   r.title,
// //               url:     r.url,
// //               preview: r.text,
// //             })),
// //           },
// //         },
// //         callB: {
// //           news: {
// //             count:   signalsData.news.results.length,
// //             results: signalsData.news.results.map(r => ({
// //               title:      r.title,
// //               url:        r.url,
// //               published:  r.publishedDate?.slice(0, 20),
// //               highlights: r.highlights,
// //               preview:    r.text,
// //             })),
// //           },
// //           founders: {
// //             count:   signalsData.founders.results.length,
// //             results: signalsData.founders.results.map(r => ({
// //               title:   r.title,
// //               url:     r.url,
// //               preview: r.text,
// //             })),
// //           },
// //         },
// //         gapFill: {
// //           count:   gapData.length,
// //           results: gapData.map((r, i) => ({
// //             query:   gapResult.gaps[i],
// //             count:   r.results?.length || 0,
// //             results: (r.results || []).map(x => ({
// //               title:   x.title,
// //               url:     x.url,
// //               preview: x.text,
// //             })),
// //           })),
// //         },
// //       },
// //     };

// //     // Save results cache before synthesizing
// //     // This way if synthesis fails, the next request can resume from here
// //     writeCache(RESULT_CACHE_DIR, company, descriptor, pipelineOutput);
// //     send(res, { step: 8 });
// //     // ── Synthesizer ───────────────────────────────────────────
// //     const intelligenceReport = await synthesize(company, pipelineOutput);

// //     const finalOutput = {
// //       ...pipelineOutput,
// //       status: 'complete',
// //       intelligence_report: intelligenceReport,
// //     };
 
// //     // Save to synthesized cache — this is what future requests will hit first
// //     writeCache(SYNTHESIZED_CACHE, company, descriptor, finalOutput);

// //     send(res, {
// //       step: 'done',
// //       data: finalOutput,
// //       served_from_cache: false,
// //     });
// //     res.end();

// //   } catch (error) {
// //     console.error('[Stream] Pipeline error:', error.message);
// //     send(res, { step: 'error', message: error.message });
// //     res.end();
// //   }
// // });

// // ─────────────────────────────────────────────────────────────
// // DELETE /cache — clear cache for a specific company
// // Body: { company, descriptor? }
// // Useful during development or when forcing a re-research
// // ─────────────────────────────────────────────────────────────

// app.delete('/cache', (req, res) => {
//   const { company, descriptor } = req.body;

//   if (!company) {
//     return res.status(400).json({ error: 'Company name is required' });
//   }

//   const key = getCacheKey(company, descriptor);
//   const targets = [
//     path.join(SYNTHESIZED_CACHE, key),
//     path.join(RESULT_CACHE_DIR, key),
//     path.join(EXA_CACHE_DIR, key),
//   ];

//   const deleted = [];
//   targets.forEach(file => {
//     if (fs.existsSync(file)) {
//       fs.unlinkSync(file);
//       deleted.push(path.relative(CACHE_DIR, file));
//     }
//   });

//   console.log(`[Cache] Cleared for "${company}": ${deleted.length} file(s) deleted`);
//   res.json({ cleared: deleted, company, descriptor: descriptor || null });
// });

// // ─────────────────────────────────────────────────────────────
// // GET /cache — list what's cached (useful for debugging)
// // ─────────────────────────────────────────────────────────────

// app.get('/cache', (req, res) => {
//   const list = (dir) =>
//     fs.existsSync(dir)
//       ? fs.readdirSync(dir).filter(f => f.endsWith('.json'))
//       : [];

//   res.json({
//     synthesizedOutput: list(SYNTHESIZED_CACHE),
//     results:           list(RESULT_CACHE_DIR),
//     exa:               list(EXA_CACHE_DIR),
//   });
// });

// // ─────────────────────────────────────────────────────────────
// // POST /research/test — test new Exa search pipeline
// // Body: { company, descriptor? }
// // ─────────────────────────────────────────────────────────────

// // ─────────────────────────────────────────────────────────────
// // POST /research/test — test new Exa search pipeline
// // Body: { company, descriptor? }
// // ─────────────────────────────────────────────────────────────

// app.post('/research/test', async (req, res) => {
//   const { company, descriptor } = req.body;

//   if (!company || company.trim() === '') {
//     return res.status(400).json({ error: 'Company name is required' });
//   }

//   // company field IS the site domain (e.g. "starboard.biz")
//   const site = company.replace(/^https?:\/\//, '').replace(/\/$/, '');

//   // bb/ directory for filtered result inspection
//   const BB_DIR = path.join(__dirname, 'bb');
//   if (!fs.existsSync(BB_DIR)) fs.mkdirSync(BB_DIR, { recursive: true });

//   try {
//     console.log(`[Test] Running pipeline for: ${site}`);

//     // ── Step 1: Get raw Exa results (cache or live) ───────────
//     const cachedExa = readCache(EXA_CACHE_DIR, site, descriptor);
//     let rawData;

//     if (cachedExa) {
//       console.log('[Test] Exa cache hit — skipping searches');
//       rawData = cachedExa;
//     } else {
//       console.log('[Test] No Exa cache — running searches');
//       const searchData = await runAllSearches(site, site, descriptor);

//       rawData = {
//         identity:    { count: searchData.identity.results.length,    results: searchData.identity.results },
//         funding:     { count: searchData.funding.results.length,     results: searchData.funding.results },
//         competitors: { count: searchData.competitors.results.length, results: searchData.competitors.results },
//         team:        { count: searchData.team.results.length,        results: searchData.team.results },
//         news:        { count: searchData.news.results.length,        results: searchData.news.results },
//         ecosystem:   { count: searchData.ecosystem.results.length,   results: searchData.ecosystem.results },
//       };

//       writeCache(EXA_CACHE_DIR, site, descriptor, rawData);
//     }

//     // ── Step 2: Run noise filter ──────────────────────────────
//     console.log('[Test] Running noise filter...');
//     const filtered = filterNoise(rawData, site, site);

//     // ── Step 3: Save filtered results to bb/ for inspection ──
//     const bbKey = `${site}_${descriptor || 'no-descriptor'}`
//       .toLowerCase()
//       .replace(/\s+/g, '-')
//       .replace(/[^a-z0-9-]/g, '');

//     const bbFile = path.join(BB_DIR, `${bbKey}.json`);
//     fs.writeFileSync(bbFile, JSON.stringify({
//       meta: {
//         site,
//         descriptor: descriptor || null,
//         served_from_cache: !!cachedExa,
//         filter_stats: filtered._meta,
//       },
//       raw_counts: {
//         identity:    rawData.identity.count,
//         funding:     rawData.funding.count,
//         competitors: rawData.competitors.count,
//         team:        rawData.team.count,
//         news:        rawData.news.count,
//         ecosystem:   rawData.ecosystem.count,
//       },
//       filtered_counts: {
//         identity:    filtered.identity.count,
//         funding:     filtered.funding.count,
//         competitors: filtered.competitors.count,
//         team:        filtered.team.count,
//         news:        filtered.news.count,
//         ecosystem:   filtered.ecosystem.count,
//       },
//       filtered,
//     }, null, 2));

//     console.log(`[Test] Filtered results saved → bb/${bbKey}.json`);

//     // ── Step 4: Return comparison ─────────────────────────────
//     res.json({
//       site,
//       descriptor: descriptor || null,
//       served_from_cache: !!cachedExa,
//       raw_counts: {
//         identity:    rawData.identity.count,
//         funding:     rawData.funding.count,
//         competitors: rawData.competitors.count,
//         team:        rawData.team.count,
//         news:        rawData.news.count,
//         ecosystem:   rawData.ecosystem.count,
//       },
//       filtered_counts: {
//         identity:    filtered.identity.count,
//         funding:     filtered.funding.count,
//         competitors: filtered.competitors.count,
//         team:        filtered.team.count,
//         news:        filtered.news.count,
//         ecosystem:   filtered.ecosystem.count,
//       },
//       filter_stats: filtered._meta,
//     });

//   } catch (error) {
//     console.error('[Test] Error:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Verity backend running on port ${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { runAllSearches, fillGaps, deduplicateByDomain  } = require('./research/exaSearches');
const { filterNoise, filterGapFill }                     = require('./research/filterNoise');
const  {detectGaps }                      =require('./research/gapDetector') 
const { synthesize }               = require('./research/synthesizer');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────────────────────
// CACHE SETUP — 4 tiers, checked top to bottom on every request
//
//   .cache/
//     Result/      ← Tier 1: full synthesized report (skip everything)
//     ReSearched/  ← Tier 2: filtered + gap-filled data (skip to synthesizer)
//     Filtered/    ← Tier 3: noise-filtered Exa data (skip Exa + filter, run gap + synthesize)
//     Searched/    ← Tier 4: raw Exa results (skip Exa, run filter + gap + synthesize)
//
// On a cache hit at any tier, all lower tiers are skipped.
// On a full miss, pipeline runs from scratch and populates all tiers.
// ─────────────────────────────────────────────────────────────

const CACHE_DIR      = path.join(__dirname, '.cache');
const RESULT_DIR     = path.join(CACHE_DIR, 'Result');
const RESEARCHED_DIR = path.join(CACHE_DIR, 'ReSearched');
const FILTERED_DIR   = path.join(CACHE_DIR, 'Filtered');
const SEARCHED_DIR   = path.join(CACHE_DIR, 'Searched');

[CACHE_DIR, RESULT_DIR, RESEARCHED_DIR, FILTERED_DIR, SEARCHED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('[Cache] Tiers ready: Result/ ReSearched/ Filtered/ Searched/');

// ─────────────────────────────────────────────────────────────
// CACHE HELPERS
// ─────────────────────────────────────────────────────────────

function getCacheKey(site, descriptor) {
  return `${site}_${descriptor || 'no-descriptor'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.json';
}

function readCache(dir, site, descriptor) {
  const file = path.join(dir, getCacheKey(site, descriptor));
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

function writeCache(dir, site, descriptor, data) {
  const file = path.join(dir, getCacheKey(site, descriptor));
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
// POST /research/stream — main SSE pipeline (pending rewrite)
// ─────────────────────────────────────────────────────────────

// app.post('/research/stream', async (req, res) => { ... });

// ─────────────────────────────────────────────────────────────
// DELETE /cache — clear all cache tiers for a specific company
// Body: { company, descriptor? }
// ─────────────────────────────────────────────────────────────

app.delete('/cache', (req, res) => {
  const { company, descriptor } = req.body;

  if (!company) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const site = company.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const key  = getCacheKey(site, descriptor);

  const targets = [
    path.join(RESULT_DIR,     key),
    path.join(RESEARCHED_DIR, key),
    path.join(FILTERED_DIR,   key),
    path.join(SEARCHED_DIR,   key),
  ];

  const deleted = [];
  targets.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      deleted.push(path.relative(CACHE_DIR, file));
    }
  });

  console.log(`[Cache] Cleared for "${site}": ${deleted.length} file(s) deleted`);
  res.json({ cleared: deleted, site, descriptor: descriptor || null });
});

// ─────────────────────────────────────────────────────────────
// GET /cache — list what's cached across all tiers
// ─────────────────────────────────────────────────────────────

app.get('/cache', (req, res) => {
  const list = (dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(f => f.endsWith('.json'))
      : [];

  res.json({
    Result:     list(RESULT_DIR),
    ReSearched: list(RESEARCHED_DIR),
    Filtered:   list(FILTERED_DIR),
    Searched:   list(SEARCHED_DIR),
  });
});

// ─────────────────────────────────────────────────────────────
// POST /research/test
//
// 4-tier cache pipeline — stops at first hit, works down on miss:
//
//   Tier 1 Result:     synthesized report exists → return immediately
//   Tier 2 ReSearched: gap-filled data exists → return immediately
//   Tier 3 Filtered:   filtered data exists → run gap detection only
//   Tier 4 Searched:   raw Exa data exists → run filter + gap detection
//   Miss:              run Exa → filter → gap detect → gap fill
//
// Input: { company: "stripe.com", descriptor: "payment processing fintech" }
// ─────────────────────────────────────────────────────────────

// app.post('/research/test', async (req, res) => {
//   const { company, descriptor } = req.body;
 
//   if (!company || company.trim() === '') {
//     return res.status(400).json({ error: 'Company name is required' });
//   }
 
//   const site = company.replace(/^https?:\/\//, '').replace(/\/$/, '');
 
//   try {
//     console.log(`[Test] Pipeline starting for: ${site}`);
 
//     // ── TIER 1: Result ────────────────────────────────────────
//     const cachedResult = readCache(RESULT_DIR, site, descriptor);
//     if (cachedResult) {
//       return res.json({
//         site,
//         descriptor:        descriptor || null,
//         served_from_cache: 'Result',
//         ...cachedResult,
//       });
//     }
 
//     // ── TIER 2: ReSearched ────────────────────────────────────
//     const cachedReSearched = readCache(RESEARCHED_DIR, site, descriptor);
//     if (cachedReSearched) {
//       return res.json({
//         site,
//         descriptor:        descriptor || null,
//         served_from_cache: 'ReSearched',
//         ...cachedReSearched,
//       });
//     }
 
//     // ── TIER 3 + 4: Filtered / Searched ──────────────────────
//     let filtered;
 
//     const cachedFiltered = readCache(FILTERED_DIR, site, descriptor);
//     if (cachedFiltered) {
//       console.log('[Test] Filtered cache hit — skipping Exa + filter');
//       filtered = cachedFiltered;
//     } else {
//       let rawData;
 
//       const cachedSearched = readCache(SEARCHED_DIR, site, descriptor);
//       if (cachedSearched) {
//         console.log('[Test] Searched cache hit — skipping Exa, running filter');
//         rawData = cachedSearched;
//       } else {
//         console.log('[Test] No cache — running Exa searches');
//         const searchData = await runAllSearches(site, site, descriptor);
 
//         rawData = {
//           identity:    { count: searchData.identity.results.length,    results: searchData.identity.results },
//           funding:     { count: searchData.funding.results.length,     results: searchData.funding.results },
//           competitors: { count: searchData.competitors.results.length, results: searchData.competitors.results },
//           team:        { count: searchData.team.results.length,        results: searchData.team.results },
//           news:        { count: searchData.news.results.length,        results: searchData.news.results },
//           ecosystem:   { count: searchData.ecosystem.results.length,   results: searchData.ecosystem.results },
//         };
 
//         writeCache(SEARCHED_DIR, site, descriptor, rawData);
//       }
 
//       console.log('[Test] Running noise filter...');
//       filtered = filterNoise(rawData, site, site);
//       writeCache(FILTERED_DIR, site, descriptor, filtered);
//     }
 
//     // ── Gap detection ─────────────────────────────────────────
//     console.log('[Test] Running gap detection...');
//     const gapResult = await detectGaps(filtered, {
//       company:    site,
//       domain:     site,
//       descriptor: descriptor || '',
//     });
 
//     console.log('[Test] Gap queries:', JSON.stringify(gapResult.gaps));
//     console.log('[Test] Ecosystem fallback query:', gapResult.ecosystem_fallback_query || 'none');
 
//     // ── Ecosystem fallback ────────────────────────────────────
//     let ecosystemFallbackResults = [];
//     const fallbackQuery = gapResult.ecosystem_fallback_query;
 
//     if (fallbackQuery) {
//       const fallbackPrefix = fallbackQuery.toLowerCase().slice(0, 25);
//       const isDuplicateOfGap = gapResult.gaps.some(g =>
//         g.toLowerCase().slice(0, 25) === fallbackPrefix
//       );
 
//       if (isDuplicateOfGap) {
//         console.log('[Test] Ecosystem fallback skipped — duplicate of gap query');
//       } else {
//         console.log(`[Test] Running ecosystem fallback: "${fallbackQuery}"`);
//         const fallback = await fillGaps([fallbackQuery], '');
//         const rawFallback = fallback[0]?.results || [];
 
//         // Filter then deduplicate by domain
//         const filteredFallback = filterGapFill(rawFallback, site, site);
//         ecosystemFallbackResults = deduplicateByDomain(filteredFallback);
//         console.log(`[Test] Ecosystem fallback: ${ecosystemFallbackResults.length} results after filter + dedup`);
//       }
//     }
 
//     // ── Gap fill ──────────────────────────────────────────────
//     let gapFillResults = [];
//     if (gapResult.gaps.length > 0) {
//       console.log(`[Test] Filling ${gapResult.gaps.length} gap(s)...`);
//       const filled = await fillGaps(gapResult.gaps, site);
 
//       gapFillResults = filled.map((r, i) => {
//         // Filter noise first, then deduplicate by normalized URL
//         const clean = filterGapFill(r.results || [], site, site);
 
//         const normalizeUrl = url => url.replace(/\/$/, '').split('?')[0].toLowerCase();
//         const seenUrls = new Set();
//         const deduped = clean.filter(res => {
//           const key = normalizeUrl(res.url);
//           if (seenUrls.has(key)) return false;
//           seenUrls.add(key);
//           return true;
//         });
 
//         return {
//           query:   gapResult.gaps[i],
//           count:   deduped.length,
//           results: deduped,
//         };
//       });
//     } else {
//       console.log('[Test] No gaps to fill');
//     }
 
//     // ── Assemble and save ReSearched bundle ───────────────────
//     const reSearched = {
//       site,
//       descriptor: descriptor || null,
//       gap_detection: {
//         gaps_found:               gapResult.gaps.length,
//         gaps:                     gapResult.gaps,
//         ecosystem_fallback_query: gapResult.ecosystem_fallback_query || null,
//         confidence:               gapResult.confidence,
//         notes:                    gapResult.notes,
//       },
//       filtered_counts: {
//         identity:    filtered.identity.count,
//         funding:     filtered.funding.count,
//         competitors: filtered.competitors.count,
//         team:        filtered.team.count,
//         news:        filtered.news.count,
//         ecosystem:   filtered.ecosystem.count,
//       },
//       filtered,
//       gap_fill: {
//         count:   gapFillResults.length,
//         results: gapFillResults,
//       },
//       ecosystem_fallback: {
//         count:   ecosystemFallbackResults.length,
//         results: ecosystemFallbackResults,
//       },
//     };
 
//     console.log('[Test] Writing ReSearched cache...');
//     writeCache(RESEARCHED_DIR, site, descriptor, reSearched);
 
//     // ── Return ────────────────────────────────────────────────
//     res.json({
//       site,
//       descriptor:               descriptor || null,
//       served_from_cache:        false,
//       filtered_counts:          reSearched.filtered_counts,
//       filter_stats:             filtered._meta,
//       gap_detection:            reSearched.gap_detection,
//       gap_fill_count:           gapFillResults.length,
//       ecosystem_fallback_count: ecosystemFallbackResults.length,
//     });
 
//   } catch (error) {
//     console.error('[Test] Pipeline error:', error.message);
//     console.error('[Test] Stack:', error.stack);
//     res.status(500).json({ error: error.message });
//   }
// });

app.post('/research/test', async (req, res) => {
  const { company, descriptor } = req.body;
 
  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }
 
  const site = company.replace(/^https?:\/\//, '').replace(/\/$/, '');
 
  try {
    console.log(`[Test] Pipeline starting for: ${site}`);
 
    // ── TIER 1: Result ────────────────────────────────────────
    const cachedResult = readCache(RESULT_DIR, site, descriptor);
    if (cachedResult) {
      return res.json({
        site,
        descriptor:        descriptor || null,
        served_from_cache: 'Result',
        report:            cachedResult,
      });
    }
 
    // ── TIER 2: ReSearched ────────────────────────────────────
    let reSearched = readCache(RESEARCHED_DIR, site, descriptor);
    if (reSearched) {
      console.log('[Test] ReSearched cache hit — skipping to synthesis');
    } else {
 
      // ── TIER 3 + 4: Filtered / Searched ────────────────────
      let filtered;
 
      const cachedFiltered = readCache(FILTERED_DIR, site, descriptor);
      if (cachedFiltered) {
        console.log('[Test] Filtered cache hit — skipping Exa + filter');
        filtered = cachedFiltered;
      } else {
        let rawData;
 
        const cachedSearched = readCache(SEARCHED_DIR, site, descriptor);
        if (cachedSearched) {
          console.log('[Test] Searched cache hit — skipping Exa, running filter');
          rawData = cachedSearched;
        } else {
          console.log('[Test] No cache — running Exa searches');
          const searchData = await runAllSearches(site, site, descriptor);
 
          rawData = {
            identity:    { count: searchData.identity.results.length,    results: searchData.identity.results },
            funding:     { count: searchData.funding.results.length,     results: searchData.funding.results },
            competitors: { count: searchData.competitors.results.length, results: searchData.competitors.results },
            team:        { count: searchData.team.results.length,        results: searchData.team.results },
            news:        { count: searchData.news.results.length,        results: searchData.news.results },
            ecosystem:   { count: searchData.ecosystem.results.length,   results: searchData.ecosystem.results },
          };
 
          writeCache(SEARCHED_DIR, site, descriptor, rawData);
        }
 
        console.log('[Test] Running noise filter...');
        filtered = filterNoise(rawData, site, site);
        writeCache(FILTERED_DIR, site, descriptor, filtered);
      }
 
      // ── Gap detection ───────────────────────────────────────
      console.log('[Test] Running gap detection...');
      const gapResult = await detectGaps(filtered, {
        company:    site,
        domain:     site,
        descriptor: descriptor || '',
      });
 
      console.log('[Test] Gap queries:', JSON.stringify(gapResult.gaps));
      console.log('[Test] Ecosystem fallback query:', gapResult.ecosystem_fallback_query || 'none');
 
      // ── Ecosystem fallback ──────────────────────────────────
      let ecosystemFallbackResults = [];
      const fallbackQuery = gapResult.ecosystem_fallback_query;
 
      if (fallbackQuery) {
        const fallbackPrefix   = fallbackQuery.toLowerCase().slice(0, 25);
        const isDuplicateOfGap = gapResult.gaps.some(g =>
          g.toLowerCase().slice(0, 25) === fallbackPrefix
        );
 
        if (isDuplicateOfGap) {
          console.log('[Test] Ecosystem fallback skipped — duplicate of gap query');
        } else {
          console.log(`[Test] Running ecosystem fallback: "${fallbackQuery}"`);
          const fallback         = await fillGaps([fallbackQuery], '');
          const rawFallback      = fallback[0]?.results || [];
          const filteredFallback = filterGapFill(rawFallback, site, site);
          ecosystemFallbackResults = deduplicateByDomain(filteredFallback);
          console.log(`[Test] Ecosystem fallback: ${ecosystemFallbackResults.length} results after filter + dedup`);
        }
      }
 
      // ── Gap fill ────────────────────────────────────────────
      let gapFillResults = [];
      if (gapResult.gaps.length > 0) {
        console.log(`[Test] Filling ${gapResult.gaps.length} gap(s)...`);
        const filled = await fillGaps(gapResult.gaps, '');
 
        gapFillResults = filled.map((r, i) => {
          const clean = filterGapFill(r.results || [], site, site);
 
          const normalizeUrl = url => url.replace(/\/$/, '').split('?')[0].toLowerCase();
          const seenUrls     = new Set();
          const deduped      = clean.filter(res => {
            const key = normalizeUrl(res.url);
            if (seenUrls.has(key)) return false;
            seenUrls.add(key);
            return true;
          });
 
          return {
            query:   gapResult.gaps[i],
            count:   deduped.length,
            results: deduped,
          };
        });
      } else {
        console.log('[Test] No gaps to fill');
      }
 
      // ── Assemble and save ReSearched bundle ─────────────────
      reSearched = {
        site,
        descriptor: descriptor || null,
        gap_detection: {
          gaps_found:               gapResult.gaps.length,
          gaps:                     gapResult.gaps,
          ecosystem_fallback_query: gapResult.ecosystem_fallback_query || null,
          confidence:               gapResult.confidence,
          notes:                    gapResult.notes,
        },
        filtered_counts: {
          identity:    filtered.identity.count,
          funding:     filtered.funding.count,
          competitors: filtered.competitors.count,
          team:        filtered.team.count,
          news:        filtered.news.count,
          ecosystem:   filtered.ecosystem.count,
        },
        filtered,
        gap_fill: {
          count:   gapFillResults.length,
          results: gapFillResults,
        },
        ecosystem_fallback: {
          count:   ecosystemFallbackResults.length,
          results: ecosystemFallbackResults,
        },
      };
 
      console.log('[Test] Writing ReSearched cache...');
      writeCache(RESEARCHED_DIR, site, descriptor, reSearched);
    }
 
    // ── Synthesis ─────────────────────────────────────────────
    console.log('[Test] Running synthesis...');
    const report = await synthesize(site, reSearched);
 
    writeCache(RESULT_DIR, site, descriptor, report);
 
    res.json({
      site,
      descriptor:        descriptor || null,
      served_from_cache: false,
      report,
    });
 
  } catch (error) {
    console.error('[Test] Pipeline error:', error.message);
    console.error('[Test] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});