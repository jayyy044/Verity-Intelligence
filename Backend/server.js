const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { callA, callB } = require('./research/exaSearches');

const app = express();
app.use(express.json());
app.use(cors());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Verity backend is running' });
});

// ─────────────────────────────────────────────────────────────
// POST /research — the single pipeline endpoint
// Body: { company: "Starboard", descriptor: "AI freight forwarding logistics" }
// descriptor is optional — omit for unambiguous company names
// ─────────────────────────────────────────────────────────────

app.post('/research', async (req, res) => {
  const { company, descriptor } = req.body;

  if (!company || company.trim() === '') {
    return res.status(400).json({ error: 'Company name is required' });
  }

  const searchLabel = descriptor ? `${company} (${descriptor})` : company;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`New research request: ${searchLabel}`);
  console.log(`${'='.repeat(50)}`);

  try {
    // Phase 1 — run Call A and Call B in parallel
    console.log('[Pipeline] Starting Phase 1 — parallel Exa retrieval...');
    const startTime = Date.now();

    const [commercialData, signalsData] = await Promise.all([
      callA(company, descriptor),
      callB(company, descriptor),
    ]);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Pipeline] Phase 1 complete in ${elapsed}s`);

    return res.json({
      status: 'exa_complete',
      company,
      descriptor: descriptor || null,
      elapsed_seconds: elapsed,
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
    return res.status(500).json({
      error: 'Research pipeline failed',
      detail: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verity backend running on port ${PORT}`);
});