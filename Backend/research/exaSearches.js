const Exa = require('exa-js').default;

const exa = new Exa(process.env.EXA_API_KEY);

// ─────────────────────────────────────────────────────────────
// HELPER — Deduplicate results by root domain
// Catches any subdomain duplication not blocked by excludeDomains
// ─────────────────────────────────────────────────────────────

function deduplicateByDomain(results) {
  const seenDomains = new Set();
  return results.filter(r => {
    try {
      const domain = new URL(r.url).hostname
        .replace(/^www\./, '')
        .replace(/^mobile\./, '')
        .replace(/^m\./, '')
        .replace(/^arc-staging\./, '')
        .replace(/^beta\./, '')
        .replace(/^web\./, '')
        .replace(/^amp\./, '');
      if (seenDomains.has(domain)) return false;
      seenDomains.add(domain);
      return true;
    } catch {
      return true;
    }
  });
}

// ─────────────────────────────────────────────────────────────
// CALL A — Commercial Intelligence
// Fields: company identity, description, sector,
//         funding, investors, competitors, ecosystem
// ─────────────────────────────────────────────────────────────

async function callA(company, descriptor = '') {
  const searchTerm = descriptor ? `${company} ${descriptor}` : company;
  console.log(`[Call A] Starting commercial search for: ${searchTerm}`);

  const [companyProfile, competitors, funding, ecosystem] = await Promise.all([

    // Company identity + description + sector
    exa.search(
      `${searchTerm} company overview business model product`,
      {
        type: 'neural',
        numResults: 5,
        contents: { text: { maxCharacters: 20000 }, livecrawl: 'fallback' },
      }
    ),

    // Direct competitors + ecosystem nodes
    exa.search(
      `companies similar to ${searchTerm} competitors alternatives`,
      {
        type: 'neural',
        numResults: 8,
        contents: { text: { maxCharacters: 10000 }, livecrawl: 'fallback' },
      }
    ),

    // Funding rounds + investors + total raised
    exa.search(
      `${searchTerm} funding round raised series investors`,
      {
        type: 'neural',
        numResults: 6,
        includeText: [company],
        includeDomains: [
          'techcrunch.com',
          'betakit.com',
          'bloomberg.com',
          'reuters.com',
          'businesswire.com',
          'prnewswire.com',
          'globenewswire.com',
          'newswire.ca',
        ],
        contents: { text: { maxCharacters: 10000 } },
      }
    ),

    // Ecosystem relationships — partners, customers, integrations
    // Powers the non-competitor nodes on the Bloomberg map
    exa.search(
      `${searchTerm} partnership integration customer enterprise deal`,
      {
        type: 'neural',
        numResults: 6,
        includeText: [company],
        contents: { text: { maxCharacters: 8000 } },
      }
    ),
  ]);

  console.log(`[Call A] Done — company: ${companyProfile.results.length}, competitors: ${competitors.results.length}, funding: ${funding.results.length}, ecosystem: ${ecosystem.results.length}`);

  return { companyProfile, competitors, funding, ecosystem };
}

// ─────────────────────────────────────────────────────────────
// CALL B — Signals Intelligence
// Fields: news events, sentiment, CEO/founder background
// ─────────────────────────────────────────────────────────────

async function callB(company, descriptor = '') {
  const searchTerm = descriptor ? `${company} ${descriptor}` : company;
  console.log(`[Call B] Starting signals search for: ${searchTerm}`);

  const [newsRaw, founders] = await Promise.all([

    // Recent news events + sentiment signals (last 12 months)
    // excludeDomains blocks known subdomain offenders upfront
    // deduplicateByDomain catches anything else that slips through
    exa.search(
      `${searchTerm} news announcement partnership product launch`,
      {
        type: 'neural',
        numResults: 10,
        includeText: [company],
        startPublishedDate: getOneYearAgo(),
        excludeDomains: [
          '*.theglobeandmail.com',
          '*.bloomberg.com',
          '*.reuters.com',
          '*.businessinsider.com',
          '*.techcrunch.com',
        ],
        contents: {
          text: { maxCharacters: 5000 },
          highlights: { numSentences: 3, highlightsPerUrl: 2 },
        },
      }
    ),

    // CEO + founder name and background
    exa.search(
      `${searchTerm} CEO founder leadership background`,
      {
        type: 'neural',
        numResults: 5,
        contents: { text: { maxCharacters: 8000 }, livecrawl: 'fallback' },
      }
    ),
  ]);

  // Second line of defence — catch any remaining subdomain duplicates
  const news = {
    ...newsRaw,
    results: deduplicateByDomain(newsRaw.results),
  };

  console.log(`[Call B] Done — news: ${news.results.length} (deduplicated from ${newsRaw.results.length}), founders: ${founders.results.length}`);

  return { news, founders };
}

// ─────────────────────────────────────────────────────────────
// GAP FILL — Targeted searches from gap detector
// Only runs if Phase 2 identifies missing fields
// ─────────────────────────────────────────────────────────────

async function fillGaps(gapQueries) {
  if (!gapQueries || gapQueries.length === 0) return [];

  console.log(`[Gap Fill] Running ${gapQueries.length} targeted searches...`);

  const results = await Promise.all(
    gapQueries.map(query =>
      exa.search(query, {
        type: 'neural',
        numResults: 4,
        contents: {
          text: { maxCharacters: 8000 },
          livecrawl: 'always',
        },
      })
    )
  );

  results.forEach((r, i) => {
    console.log(`[Gap Fill] Query ${i + 1}: ${gapQueries[i]} — ${r.results.length} results`);
  });

  return results;
}

// ─────────────────────────────────────────────────────────────
// HELPER — ISO date string for 12 months ago
// ─────────────────────────────────────────────────────────────

function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0] + 'T00:00:00Z';
}

module.exports = { callA, callB, fillGaps };