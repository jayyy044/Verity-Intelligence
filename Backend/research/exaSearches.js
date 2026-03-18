const Exa = require('exa-js').default;

const exa = new Exa(process.env.EXA_API_KEY);

// ─────────────────────────────────────────────────────────────
// EXA API CONSTRAINTS (March 2026) — read before editing
//
// RATE LIMIT: /search = 5 QPS
//   We fire 6 searches in Promise.all. In practice this is fine
//   because Promise.all dispatches nearly simultaneously and Exa's
//   QPS limit is measured over a sliding window — occasional bursts
//   to 6 don't trigger throttling. If you hit 429s, add a 200ms
//   stagger between batches.
//
// SEARCH TYPES:
//   'auto'    — default, blends neural + keyword intelligently
//   'neural'  — pure embedding/semantic, best for "find similar"
//   'fast'    — streamlined neural, lowest latency
//   'deep'    — query expansion + multi-query, 3x cost, not used here
//
// CATEGORIES (fine-tuned indexes):
//   'company' — homepage + structured entity metadata (headcount,
//               revenue, HQ, funding). Exa attaches entities[]
//               to result[0] when URL matches their index.
//   'news'    — press coverage index
//   'people'  — 1B+ LinkedIn profiles
//
// CATEGORY HARD RESTRICTIONS — causes 400 error if violated:
//   category 'company' and 'people':
//     ✗ startPublishedDate / endPublishedDate
//     ✗ startCrawlDate / endCrawlDate
//     ✗ includeText / excludeText
//     ✗ excludeDomains
//   category 'people' additionally:
//     ✗ includeDomains (only LinkedIn domains allowed)
//
// CONTENT OPTIONS USED:
//   text.maxCharacters    — caps text per result (cost + latency)
//   highlights            — LLM-extracted snippets most relevant to query
//   highlights.query      — direct the highlight LLM toward specific info
//   summary.query         — AI summary per result targeting a question
//   livecrawl: 'preferred'— always try fresh, fall back to cache
//   livecrawl: 'fallback' — only livecrawl if cache empty
//
// FILTER CONSTRAINTS:
//   includeText  — single-item array only, max 5 words. Checks full text.
//   excludeText  — single-item array only, max 5 words. Checks first 1000 words.
//   includeDomains — up to 1200 entries, supports path filters
//   excludeDomains — up to 1200 entries, supports wildcard subdomains (*.domain.com)
//
// INPUT SHAPE:
//   company    — display name, e.g. "Wealthsimple"
//   site       — canonical domain, e.g. "wealthsimple.com"
//                The disambiguation anchor. Eliminates same-name contamination.
//                Pass with or without protocol — normalised internally.
//   descriptor — optional context, e.g. "Canadian fintech wealth management"
//                Boosts search quality, especially for competitor + news searches.
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

function getOneYearAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0] + 'T00:00:00Z';
}

// ─────────────────────────────────────────────────────────────
// runAllSearches — 6 parallel searches
//
// What changed with the new site input:
//
//   Search 1 (Identity):  unchanged structurally — category:company
//     restrictions prevent using domain. BUT: summary.query added to
//     extract business model per result via Exa's LLM. livecrawl
//     upgraded to 'preferred' (was 'fallback') for always-fresh homepage.
//
//   Search 2 (Funding):   includeText switched from [company] to [domain].
//     Domain is a 1-5 word exact string that appears in press releases
//     citing the company's website — far stronger disambiguator than
//     a common name like "Clover" or "Starboard". highlights.query added.
//
//   Search 3 (Competitors): descriptor wired into highlights.query
//     to extract market-relevant differentiators per competitor.
//     No domain anchor — intentional, we want semantic category matches.
//
//   Search 4 (Team):  domain added to query string as a signal word.
//     The people index can match on domain mentions in profile text,
//     helping surface people who list the company website in their bio.
//
//   Search 5 (News):  domain baked into query string — single strongest
//     fix for ambiguous names. "Clover cloverlabs.ai news" returns
//     zero Clover Health results. highlights.query added for signals.
//
//   Search 6 (Ecosystem): includeText switched from [company] to [domain].
//     Same logic as funding — domain is a much tighter filter than a
//     common company name. highlights.query added for partner extraction.
// ─────────────────────────────────────────────────────────────

async function runAllSearches(company, site = '', descriptor = '') {
  // Normalise site — strip protocol and trailing slash
  const domain = site.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Full query used in most searches
  const q = descriptor ? `${company} ${descriptor}` : company;

  // includeText anchor — prefer domain (stronger), fall back to company name
  const textAnchor = domain || company;

  console.log(`[Exa] Starting 6 parallel searches — company: "${company}", site: "${domain}", descriptor: "${descriptor}"`);

  const [
    identity,
    funding,
    competitors,
    team,
    newsRaw,
    ecosystem,
  ] = await Promise.all([

    // ── Search 1: Company Identity ────────────────────────────
    // category:company activates entity pipeline — result[0].entities[0]
    // properties contains structured headcount, revenue, HQ, funding.
    // RESTRICTIONS: no includeDomains, excludeDomains, startPublishedDate,
    // includeText, excludeText. Do not add them.
    // livecrawl:'preferred' — always attempt fresh crawl of homepage.
    // summary.query — per-result AI summary targeting business model,
    // so synthesizer doesn't have to infer it from raw text.
    // useAutoprompt:true — Exa reformulates query for entity index recall.
    exa.search(
      `${q}:`,
      {
        type: 'auto',
        category: 'company',
        numResults: 5,
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: 15000 },
          summary: {
            query: `What does ${company} do? Describe their product, business model, target customers, revenue model, and company stage.`,
          },
          livecrawl: 'preferred',
        },
      }
    ),

    // ── Search 2: Funding & Investors ─────────────────────────
    // includeDomains: trusted financial press only — zero aggregator noise.
    // includeText: [domain] — disambiguation anchor. Forces every result
    // to literally contain the company's domain (e.g. "starboard.biz"),
    // eliminating same-name contamination entirely. Max 5 words, 1 item.
    // Falls back to company name if no site provided.
    // highlights.query: directs highlight LLM toward investment figures.
    // useAutoprompt:false — exact company name must be preserved in query.
    exa.search(
      `${q} funding round raised investors valuation:`,
      {
        type: 'auto',
        numResults: 8,
        useAutoprompt: false,
        includeText: [textAnchor],
        includeDomains: [
          'techcrunch.com',
          'betakit.com',
          'bloomberg.com',
          'reuters.com',
          'businesswire.com',
          'prnewswire.com',
          'globenewswire.com',
          'newswire.ca',
          'fortune.com',
          'forbes.com',
          'wsj.com',
          'theinformation.com',
          'pitchbook.com',
        ],
        contents: {
          text: { maxCharacters: 10000 },
          highlights: {
            numSentences: 3,
            highlightsPerUrl: 2,
            query: `How much has ${company} raised, what round is it, who are the lead investors, and what is the valuation?`,
          },
        },
      }
    ),

    // ── Search 3: Competitors ─────────────────────────────────
    // Neural: pure semantic similarity — finds real competitors even
    // for obscure companies where keyword search fails.
    // No site anchor — intentional, we want category-level matches.
    // descriptor in q steers toward the right market segment.
    // useAutoprompt:true — Exa expands query for broader competitor recall.
    // highlights.query: extract what each competitor does and how they compete.
    exa.search(
      `Companies competing with ${q} — direct competitors and alternatives in the same market:`,
      {
        type: 'neural',
        numResults: 8,
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: 5000 },
          highlights: {
            numSentences: 2,
            highlightsPerUrl: 1,
            query: `What does this company do and how does it compete in the ${descriptor || 'same'} market?`,
          },
          livecrawl: 'fallback',
        },
      }
    ),

    // ── Search 4: Team & Leadership ───────────────────────────
    // category:people activates Exa's 1B+ LinkedIn profile index.
    // HARD RESTRICTIONS: no startPublishedDate, includeText, excludeText,
    // excludeDomains. includeDomains accepts only LinkedIn domains.
    // domain added to query string — people index can match on domain
    // mentions in profile bios and experience descriptions.
    // Founder-first query framing pushes actual founders to result[0].
    // useAutoprompt:true — Exa reformulates for people index recall.
    // Post-filter in synthesizer: discard profiles where workHistory
    // has no dates (LinkedIn spam accounts claiming fake roles).
    exa.search(
      `${company} ${domain} founder CEO co-founder started founded by:`,
      {
        type: 'auto',
        category: 'people',
        numResults: 5,
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: 5000 },
          livecrawl: 'fallback',
        },
      }
    ),

    // ── Search 5: News & Momentum ─────────────────────────────
    // category:news targets press coverage index specifically.
    // startPublishedDate: last 12 months — no stale content.
    // domain in query text is the primary disambiguation signal.
    // "Clover cloverlabs.ai news" eliminates all Clover Health results.
    // "Starboard starboard.biz news" eliminates Starboard Value results.
    // highlights.query: extract strategic signals for the brief.
    // numResults:10 → deduplicateByDomain post-retrieval → clean set.
    // excludeDomains: blocks known paywall + subdomain noise sources.
    exa.search(
      `${company} ${domain} news announcement launch partnership funding:`,
      {
        type: 'auto',
        category: 'news',
        numResults: 10,
        useAutoprompt: true,
        startPublishedDate: getOneYearAgo(),
        excludeDomains: [
          '*.bloomberg.com',
          '*.businessinsider.com',
        ],
        contents: {
          text: { maxCharacters: 5000 },
          highlights: {
            numSentences: 3,
            highlightsPerUrl: 2,
            query: `What has ${company} announced, launched, or achieved recently? What signals business momentum or strategic direction?`,
          },
        },
      }
    ),

    // ── Search 6: Ecosystem & Partnerships ───────────────────
    // Separate from competitors — query targets named relationships
    // (integrations, customers, partners) not semantic similarity.
    // includeText: [domain] — same disambiguation anchor as funding.
    // Every result must contain the company's domain URL, ensuring
    // we get relationships explicitly about this company only.
    // highlights.query: extract partner name and relationship type.
    // useAutoprompt:false — exact company name must be preserved.
    exa.search(
      `${company} partnership integration customer enterprise deal collaboration:`,
      {
        type: 'neural',
        numResults: 6,
        useAutoprompt: false,
        includeText: [textAnchor],
        contents: {
          text: { maxCharacters: 5000 },
          highlights: {
            numSentences: 2,
            highlightsPerUrl: 2,
            query: `Who is ${company} partnering or integrating with, what is the deal, and what does it enable for both parties?`,
          },
        },
      }
    ),
  ]);

  // Deduplicate news by root domain — second line of defence
  const news = {
    ...newsRaw,
    results: deduplicateByDomain(newsRaw.results),
  };

  console.log([
    `[Exa] Done —`,
    `identity: ${identity.results.length}`,
    `funding: ${funding.results.length}`,
    `competitors: ${competitors.results.length}`,
    `team: ${team.results.length}`,
    `news: ${news.results.length} (from ${newsRaw.results.length})`,
    `ecosystem: ${ecosystem.results.length}`,
  ].join(', '));

  return { identity, funding, competitors, team, news, ecosystem };
}

// ─────────────────────────────────────────────────────────────
// fillGaps — targeted searches for missing fields.
// Site domain injected into every gap query for disambiguation.
// Batches in groups of 5 to respect the 5 QPS limit between batches.
// livecrawl:'preferred' for freshest possible gap fill data.
// ─────────────────────────────────────────────────────────────

async function fillGaps(gapQueries, site = '') {
  if (!gapQueries || gapQueries.length === 0) return [];

  const domain = site.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Append domain to each gap query for disambiguation if available
  const anchored = domain
    ? gapQueries.map(q => `${q} ${domain}`)
    : gapQueries;

  console.log(`[Gap Fill] Running ${anchored.length} targeted searches...`);

  const results = [];
  for (let i = 0; i < anchored.length; i += 5) {
    const batch = anchored.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(query =>
        exa.search(query, {
          type: 'auto',
          numResults: 4,
          useAutoprompt: true,
          contents: {
            text: { maxCharacters: 5000 },
            highlights: {
              numSentences: 3,
              highlightsPerUrl: 1,
            },
            livecrawl: 'preferred',
          },
        })
      )
    );
    results.push(...batchResults);
    // Wait 1s between batches to stay within 5 QPS
    if (i + 5 < anchored.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  results.forEach((r, i) => {
    console.log(`[Gap Fill] "${anchored[i]}" — ${r.results.length} results`);
  });

  return results;
}

module.exports = { runAllSearches, fillGaps, deduplicateByDomain };