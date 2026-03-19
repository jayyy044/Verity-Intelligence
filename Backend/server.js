const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

const { runAllSearches, fillGaps, deduplicateByDomain } = require('./research/exaSearches');
const { filterNoise, filterGapFill }                    = require('./research/filterNoise');
const { detectGaps }                                    = require('./research/gapDetector');
const { synthesize }                                    = require('./research/synthesizer');

const app = express();
app.use(express.json());
app.use(cors());

// ─────────────────────────────────────────────────────────────
// CACHE SETUP
//
//   .cache/
//     Result/      ← Tier 1: full synthesized report
//     ReSearched/  ← Tier 2: filtered + gap-filled bundle
//     Filtered/    ← Tier 3: noise-filtered Exa data
//     Searched/    ← Tier 4: raw Exa results
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
// SSE HELPER
// ─────────────────────────────────────────────────────────────

function send(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ─────────────────────────────────────────────────────────────
// POST /research — SSE pipeline
//
// Step mapping (matches frontend researchSteps array):
//   0 — Initializing research pipeline
//   1 — Searching company profile & business model
//   2 — Mapping competitive landscape
//   3 — Identifying ecosystem relationships
//   4 — Scanning news & sentiment signals
//   5 — Checking Sagard portfolio overlap
//   6 — Scoring investment thesis fit
//   7 — Synthesizing intelligence brief
//
// Cache behaviour:
//   Tier 1 Result hit     → stream all steps instantly, return report
//   Tier 2 ReSearched hit → stream steps 0-6 instantly, run synthesis live
//   Miss                  → run full pipeline, fire steps as each stage completes
// ─────────────────────────────────────────────────────────────

app.post('/research', async (req, res) => {
  const { company, descriptor } = req.body;

  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const site = company.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    send(res, { step: 0 }); // Initializing research pipeline

    // ── TIER 1: Result cache ──────────────────────────────────
    // Full report exists — stream all steps instantly and return
    const cachedResult = readCache(RESULT_DIR, site, descriptor);
    if (cachedResult) {
      console.log(`[Research] Result cache hit — returning immediately for: ${site}`);
      for (let s = 1; s <= 7; s++) send(res, { step: s });
      send(res, { step: 'done', data: cachedResult });
      res.end();
      return;
    }

    // ── TIER 2: ReSearched cache ──────────────────────────────
    // Gap-filled data exists — stream steps 0-6 instantly, run synthesis live
    let reSearched = readCache(RESEARCHED_DIR, site, descriptor);

    if (reSearched) {
      console.log(`[Research] ReSearched cache hit — skipping to synthesis for: ${site}`);
      for (let s = 1; s <= 6; s++) send(res, { step: s });
    } else {

      // ── TIER 3 + 4: Filtered / Searched / Full miss ─────────
      let filtered;

      const cachedFiltered = readCache(FILTERED_DIR, site, descriptor);
      if (cachedFiltered) {
        console.log('[Research] Filtered cache hit');
        filtered = cachedFiltered;
        send(res, { step: 1 });
        send(res, { step: 2 });
        send(res, { step: 3 });
        send(res, { step: 4 });
      } else {
        let rawData;

        const cachedSearched = readCache(SEARCHED_DIR, site, descriptor);
        if (cachedSearched) {
          console.log('[Research] Searched cache hit — skipping Exa');
          rawData = cachedSearched;
          send(res, { step: 1 });
        } else {
          // Full miss — run all 6 Exa searches
          console.log(`[Research] No cache — running Exa searches for: ${site}`);
          send(res, { step: 1 }); // Searching company profile & business model

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

        send(res, { step: 2 }); // Mapping competitive landscape
        send(res, { step: 3 }); // Identifying ecosystem relationships
        send(res, { step: 4 }); // Scanning news & sentiment signals

        console.log('[Research] Running noise filter...');
        filtered = filterNoise(rawData, site, site);
        writeCache(FILTERED_DIR, site, descriptor, filtered);
      }

      // ── Gap detection ───────────────────────────────────────
      console.log('[Research] Running gap detection...');
      const gapResult = await detectGaps(filtered, {
        company:    site,
        domain:     site,
        descriptor: descriptor || '',
      });

      console.log('[Research] Gap queries:', JSON.stringify(gapResult.gaps));
      console.log('[Research] Ecosystem fallback:', gapResult.ecosystem_fallback_query || 'none');

      // ── Ecosystem fallback ──────────────────────────────────
      let ecosystemFallbackResults = [];
      const fallbackQuery = gapResult.ecosystem_fallback_query;

      if (fallbackQuery) {
        const isDuplicateOfGap = gapResult.gaps.some(g =>
          g.toLowerCase().slice(0, 25) === fallbackQuery.toLowerCase().slice(0, 25)
        );

        if (!isDuplicateOfGap) {
          console.log(`[Research] Running ecosystem fallback: "${fallbackQuery}"`);
          const fallback           = await fillGaps([fallbackQuery], '');
          const rawFallback        = fallback[0]?.results || [];
          const filteredFallback   = filterGapFill(rawFallback, site, site);
          ecosystemFallbackResults = deduplicateByDomain(filteredFallback);
        } else {
          console.log('[Research] Ecosystem fallback skipped — duplicate of gap query');
        }
      }

      // ── Gap fill ────────────────────────────────────────────
      let gapFillResults = [];
      if (gapResult.gaps.length > 0) {
        console.log(`[Research] Filling ${gapResult.gaps.length} gap(s)...`);
        const filled = await fillGaps(gapResult.gaps, '');

        gapFillResults = filled.map((r, i) => {
          const clean      = filterGapFill(r.results || [], site, site);
          const normalizeUrl = url => url.replace(/\/$/, '').split('?')[0].toLowerCase();
          const seenUrls   = new Set();
          const deduped    = clean.filter(res => {
            const key = normalizeUrl(res.url);
            if (seenUrls.has(key)) return false;
            seenUrls.add(key);
            return true;
          });
          return { query: gapResult.gaps[i], count: deduped.length, results: deduped };
        });
      }

      // ── Assemble ReSearched bundle ──────────────────────────
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

      writeCache(RESEARCHED_DIR, site, descriptor, reSearched);

      send(res, { step: 5 }); // Checking Sagard portfolio overlap
      send(res, { step: 6 }); // Scoring investment thesis fit
    }

    // ── Synthesis ─────────────────────────────────────────────
    send(res, { step: 7 }); // Synthesizing intelligence brief
    console.log('[Research] Running synthesis...');

    const report = await synthesize(site, reSearched);
    writeCache(RESULT_DIR, site, descriptor, report);

    send(res, { step: 'done', data: report });
    res.end();

  } catch (error) {
    console.error('[Research] Pipeline error:', error.message);
    console.error('[Research] Stack:', error.stack);
    send(res, { step: 'error', message: error.message });
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});