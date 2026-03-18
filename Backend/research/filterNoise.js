// // ─────────────────────────────────────────────────────────────
// // filterNoise.js — deterministic pre-synthesis noise filter
// //
// // Runs on raw Exa results BEFORE gap detection and synthesis.
// // No LLM, no API calls, no cost. Pure JS string matching.
// // Removes contaminated, irrelevant, and spam results so that
// // the synthesizer only ever sees clean data or nothing.
// //
// // Philosophy: it is always better to pass nothing than noise.
// // A synthesizer working with sparse clean data produces an
// // honest brief. One working with contaminated data hallucinates.
// //
// // INPUT:  raw { identity, funding, competitors, team, news, ecosystem }
// //         company: display name e.g. "Clover Labs"
// //         domain:  normalised domain e.g. "cloverlabs.ai"
// //
// // OUTPUT: filtered { identity, funding, competitors, team, news, ecosystem }
// //         Each section has a _noise_removed count for logging.
// // ─────────────────────────────────────────────────────────────

// // ─────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────

// // Check if a string contains ANY of the given needles (case-insensitive)
// function containsAny(haystack, needles) {
//     if (!haystack || typeof haystack !== 'string') return false;
//     const lower = haystack.toLowerCase();
//     return needles.some(n => n && lower.includes(n.toLowerCase()));
//   }
  
//   // Get first N characters of text safely
//   function firstChars(text, n) {
//     if (!text || typeof text !== 'string') return '';
//     return text.slice(0, n);
//   }
  
//   // Build the full set of anchor strings for a company
//   // These are what we look for in result text to confirm relevance
//   function buildAnchors(company, domain) {
//     const anchors = [];
  
//     // Company name variants
//     if (company) {
//       anchors.push(company.trim());
//       // Also try without common suffixes for flexible matching
//       anchors.push(company.replace(/\s+(inc\.?|ltd\.?|llc\.?|corp\.?|co\.?)$/i, '').trim());
//     }
  
//     // Domain variants
//     if (domain) {
//       const d = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
//       anchors.push(d);                          // starboard.biz
//       anchors.push(d.split('.')[0]);            // starboard (root name only)
//     }
  
//     // Deduplicate and remove empty strings
//     return [...new Set(anchors.filter(Boolean))];
//   }
  
//   // ─────────────────────────────────────────────────────────────
//   // SECTION FILTERS
//   // Each returns { results, _noise_removed }
//   // ─────────────────────────────────────────────────────────────
  
//   // ── Identity ─────────────────────────────────────────────────
//   // Rules:
//   // 1. Result[0] always kept — it's the primary entity card anchor,
//   //    the synthesizer uses it for structured metadata regardless.
//   // 2. Remaining results: keep only if URL contains the domain OR
//   //    entity name matches company name OR summary doesn't explicitly
//   //    say "does not contain information about [company]".
//   // 3. Discard any result whose entity name is clearly a different
//   //    company (entity.name exists AND doesn't match company/domain).
//   function filterIdentity(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
//     const filtered = results.filter((r, i) => {
//       // Always keep result[0] — primary entity card
//       if (i === 0) return true;
  
//       const url = r.url || '';
//       const title = r.title || '';
//       const summary = r.summary || '';
//       const entityName = r.entities?.[0]?.properties?.name || '';
  
//       // Keep if URL is on the company's own domain
//       if (domain && url.toLowerCase().includes(domain.toLowerCase())) return true;
  
//       // Keep if title mentions company/domain
//       if (containsAny(title, anchors)) return true;
  
//       // Discard if summary explicitly says it's not about the company
//       const notAboutPhrases = [
//         'does not contain information about',
//         'does not provide information about',
//         'not mentioned on',
//         'no information available about',
//         'cannot describe',
//         'not about',
//       ];
//       if (notAboutPhrases.some(p => summary.toLowerCase().includes(p))) return false;
  
//       // Discard if entity name clearly belongs to a different company
//       // (entity name exists, is long enough to be meaningful, doesn't match)
//       if (entityName && entityName.length > 3) {
//         if (!containsAny(entityName, anchors)) return false;
//       }
  
//       // Default: keep if uncertain (rather than over-filter identity)
//       return true;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ── Funding ───────────────────────────────────────────────────
//   // Rules:
//   // 1. Title must mention at least one anchor (company name or domain).
//   // 2. OR: first 500 chars of text must mention at least one anchor.
//   // 3. OR: URL domain matches one of the trusted press domains AND
//   //    text within first 1000 chars mentions an anchor.
//   //    (handles cases where title is generic like "Q1 2024 Results")
//   // 4. Discard if title ONLY mentions a clearly different company
//   //    (e.g. "AlphaSense Acquires Tegus" when we're looking at Nuvei).
//   // 5. Discard generic financial market articles with no company mention.
//   function filterFunding(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
//     const filtered = results.filter(r => {
//       const title = r.title || '';
//       const text = r.text || '';
//       const url = r.url || '';
  
//       // Title mentions an anchor — strong signal, keep
//       if (containsAny(title, anchors)) return true;
  
//       // First 500 chars of text mentions an anchor
//       if (containsAny(firstChars(text, 500), anchors)) return true;
  
//       // First 1000 chars of text mentions an anchor (broader sweep)
//       if (containsAny(firstChars(text, 1000), anchors)) return true;
  
//       // Highlights mention an anchor
//       const highlights = (r.highlights || []).join(' ');
//       if (containsAny(highlights, anchors)) return true;
  
//       // Nothing matched — discard
//       return false;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ── Competitors ───────────────────────────────────────────────
//   // Rules:
//   // Competitors search is intentionally anchor-free (we want similar
//   // companies, not mentions of our company). So we filter differently:
//   // 1. Discard results that ARE the target company itself.
//   // 2. Discard results with no meaningful content (empty text, error pages).
//   // 3. Discard aggregator/comparison pages that aren't actual companies
//   //    (hrstacks.com, cbinsights.com/alternatives, etc.) — these are
//   //    listicles, not competitors.
//   // 4. Keep everything else — false negatives here are worse than false positives.
//   function filterCompetitors(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
  
//     const aggregatorPatterns = [
//       '/alternatives/',
//       '/competitors/',
//       '/compare/',
//       'hrstacks.com',
//       'cbinsights.com',
//       'g2.com/compare',
//       'capterra.com/compare',
//       'technologyadvice.com/blog',
//       'getapp.com',
//       'softwareadvice.com',
//       'trustradius.com/compare',
//       'gartner.com/peer-insights',  // add
//       'softwareworld.co',   
//     ];
  
//     const filtered = results.filter(r => {
//       const url = (r.url || '').toLowerCase();
//       const text = r.text || '';
//       const title = r.title || '';
  
//       // Discard if this IS the target company
//       if (domain && url.includes(domain.toLowerCase())) return false;
//       if (containsAny(title, [company]) && url.includes(domain?.split('.')[0] || '___')) return false;
  
//       // Discard if text is essentially empty (error page, redirect, offline app)
//       if (!text || text.trim().length < 100) return false;
  
//       // Discard known aggregator/comparison URL patterns
//       if (aggregatorPatterns.some(p => url.includes(p))) return false;
  
//       return true;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ── Team ──────────────────────────────────────────────────────
//   // Rules:
//   // 1. Must have workHistory with at least one entry that has dates.
//   //    (Eliminates LinkedIn spam accounts: "Founder CEO at X" with no history)
//   // 2. workHistory[0].company must match an anchor OR the URL path must
//   //    suggest the right company (profile text mentions domain/company).
//   // 3. Discard if the profile is clearly for someone at a same-name
//   //    different company — check workHistory company name against anchors.
//   // 4. Discard if workHistory[0].dates is null (no start date = spam).
//   // 5. Keep profiles where workHistory links to the correct Exa entity ID
//   //    (entities[0].workHistory[i].company.id matches identity result[0].id).
//   function filterTeam(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
  
//     const filtered = results.filter(r => {
//       const entity = r.entities?.[0]?.properties;
//       const workHistory = entity?.workHistory || [];
//       const text = r.text || '';
//       const title = r.title || '';
  
//       // Must have at least one work history entry
//       if (workHistory.length === 0) return false;
  
//       // Most recent role must have a start date (no date = spam)
//       const currentRole = workHistory[0];
//       if (!currentRole?.dates?.from) return false;
  
//       // Current role company must contain an anchor OR
//       // profile text/title must mention company/domain
//       const roleCompanyName = currentRole?.company?.name || '';
//       const profileMentionsAnchor = containsAny(title, anchors) ||
//                                      containsAny(firstChars(text, 1000), anchors);
//       const roleMentionsAnchor = containsAny(roleCompanyName, anchors);
  
//       if (!roleMentionsAnchor && !profileMentionsAnchor) return false;
  
//       // Extra check: if role company name exists but clearly belongs to a
//       // different entity (e.g. "LeagueApps", "LeagueRepublic", "League Sports"),
//       // discard unless the profile text otherwise confirms the right company.
//       // We do this by checking if the role company name contains the anchor
//       // but ALSO contains extra words that suggest a different org.
//       if (roleCompanyName && containsAny(roleCompanyName, anchors)) {
//         // It matches an anchor — but is it a suspicious same-name variant?
//         // Flag if role company name is substantially longer than company name
//         // and contains extra words after the company name (e.g. "League Sports Co")
//         const companyLower = company.toLowerCase();
//         const roleNameLower = roleCompanyName.toLowerCase();
//         const extraWords = roleNameLower
//           .replace(companyLower, '')
//           .trim()
//           .split(/\s+/)
//           .filter(w => w.length > 2 && !['inc', 'ltd', 'llc', 'corp', 'co', 'the'].includes(w));
  
//         if (extraWords.length >= 2) {
//           // Role company name has significant extra content — check if profile
//           // text still confirms the right company via domain
//           if (domain && !containsAny(firstChars(text, 2000), [domain])) return false;
//         }
//       }
  
//       return true;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ── News ──────────────────────────────────────────────────────
//   // Rules (most rigorous section — noise here is the most damaging):
//   // 1. Title must mention an anchor, OR
//   // 2. First 200 chars of text must mention an anchor, OR
//   // 3. First highlight must mention an anchor.
//   // All three must be checked — if none pass, discard.
//   // 4. Additional: discard if title is clearly about a different named
//   //    entity (another company with a similar name that we can detect).
//   // 5. Discard if published date is missing (undated content = low quality).
//   // 6. Discard EIN Presswire / generic press release aggregators that
//   //    slipped through — they generate massive noise for common words.
//   // 7. Discard results where text is a paywall stub (< 300 chars).
//   function filterNews(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
  
//     const noiseDomains = [
//       'einpresswire.com',
//       'uw-media.vcstar.com',
//       'www.freep.com/press-release',
//       'www.tmnews.com/press-release',
//       'www.starcourier.com/press-release',
//       'www.thegleaner.com/press-release',
//       'hutchnews.com/press-release',
//       'www.clarionledger.com/press-release',
//       'local.newsbreak.com',
//       'newsbreak.com',
//     ];
  
//     const filtered = results.filter(r => {
//       const title = r.title || '';
//       const text = r.text || '';
//       const url = (r.url || '').toLowerCase();
//       const highlights = r.highlights || [];
//       const firstHighlight = highlights[0] || '';
  
//       // Discard known noise domains / press release aggregators
//       if (noiseDomains.some(d => url.includes(d))) return false;
  
//       // Discard paywall stubs / empty content
//       if (text.trim().length < 300) return false;
  
//       // Core relevance check — any of these three must match:
//       const titleMatch = containsAny(title, anchors);
//       const textMatch = containsAny(firstChars(text, 200), anchors);
//       const highlightMatch = containsAny(firstHighlight, anchors);
  
//       if (!titleMatch && !textMatch && !highlightMatch) return false;
  
//       // Secondary check: if title matches an anchor but is clearly about
//       // a well-known different "Clover" or "Starboard" entity, discard.
//       // We detect this by looking for giveaway phrases in the title.
//       const differentEntityPhrases = [
//         'clover health',       // NASDAQ insurer
//         'clover security',     // cybersecurity startup
//         'cloover',             // energy OS company
//         'starboard value',     // activist hedge fund
//         'starboard maritime',  // NZ ocean security
//         'jeff smith',          // Starboard Value founder
//         'league republic',
//         'league sports',
//         'leagueapps',
//         'league of legends',
//       ];
//       if (differentEntityPhrases.some(p => title.toLowerCase().includes(p))) return false;
  
//       return true;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ── Ecosystem ─────────────────────────────────────────────────
//   // Rules (most thorough — ecosystem noise was 100% in our tests):
//   // 1. Full text must contain at least one anchor anywhere.
//   //    (Not just first 200 chars — partnership articles can bury the
//   //    company mention further in. But it must be there somewhere.)
//   // 2. Title must mention an anchor OR text within first 1000 chars must.
//   //    Both conditions together required — text-only match too weak.
//   // 3. Discard if the result is clearly about a generic partnership
//   //    between two companies that have nothing to do with our target
//   //    (CrowdStrike/Nvidia, Adobe/Nvidia, ServiceNow/OpenAI pattern).
//   // 4. Discard aggregator/listicle pages.
//   // 5. Discard if text < 300 chars (stub/redirect pages).
//   // 6. Fallback behaviour is handled in filterNoise() return value:
//   //    if ecosystem.results.length === 0 after filtering, the caller
//   //    (gap detector) knows to re-run with company name as anchor.
//   function filterEcosystem(results, company, domain, anchors) {
//     if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
//     const original = results.length;
  
//     const filtered = results.filter(r => {
//       const title = r.title || '';
//       const text = r.text || '';
//       const url = (r.url || '').toLowerCase();
//       const highlights = (r.highlights || []).join(' ');
  
//       // Discard stubs / empty content
//       if (text.trim().length < 300) return false;
  
//       // Title must mention anchor OR first 1000 chars of text must
//       const titleMatch = containsAny(title, anchors);
//       const textMatch = containsAny(firstChars(text, 1000), anchors);
//       const highlightMatch = containsAny(highlights, anchors);
  
//       // Require at least two of the three signals for ecosystem
//       // (stricter than news because ecosystem noise was 100% contaminated)
//       const matchCount = [titleMatch, textMatch, highlightMatch].filter(Boolean).length;
//       if (matchCount < 1) return false;
  
//       // Full text must also contain anchor somewhere (belt AND suspenders)
//       if (!containsAny(text, anchors)) return false;
  
//       // Discard known generic partnership noise patterns
//       // These appear across all companies because they're recent big tech news
//       const genericPartnershipNoise = [
//         'crowdstrike',
//         'adobe and nvidia',
//         'nvidia announce',
//         'servicenow expands openai',
//         'openai expands',
//         'hcltech and databricks',
//         'sopra steria and mistral',
//         'kiteworks and kasm',
//         'fortinet and arista',
//         'carahsoft and servicenow',
//       ];
//       const titleLower = title.toLowerCase();
//       if (genericPartnershipNoise.some(p => titleLower.includes(p))) {
//         // Only discard if our company anchor isn't in the title
//         // (edge case: maybe our company was actually involved)
//         if (!containsAny(title, anchors)) return false;
//       }
  
//       return true;
//     });
  
//     return { results: filtered, _noise_removed: original - filtered.length };
//   }
  
//   // ─────────────────────────────────────────────────────────────
//   // MAIN EXPORT — filterNoise
//   // Runs all section filters and returns cleaned results + stats
//   // ─────────────────────────────────────────────────────────────
  
//   function filterNoise(rawResults, company, domain) {
//     const normalizedDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
//     const anchors = buildAnchors(company, normalizedDomain);
  
//     console.log(`[Filter] Running noise filter — company: "${company}", domain: "${normalizedDomain}"`);
//     console.log(`[Filter] Anchors: ${JSON.stringify(anchors)}`);
  
//     const identity   = filterIdentity(rawResults.identity?.results || [], company, normalizedDomain, anchors);
//     const funding    = filterFunding(rawResults.funding?.results || [], company, normalizedDomain, anchors);
//     const competitors = filterCompetitors(rawResults.competitors?.results || [], company, normalizedDomain, anchors);
//     const team       = filterTeam(rawResults.team?.results || [], company, normalizedDomain, anchors);
//     const news       = filterNews(rawResults.news?.results || [], company, normalizedDomain, anchors);
//     const ecosystem  = filterEcosystem(rawResults.ecosystem?.results || [], company, normalizedDomain, anchors);
  
//     // Log what was removed
//     const sections = { identity, funding, competitors, team, news, ecosystem };
//     let totalRemoved = 0;
//     for (const [name, section] of Object.entries(sections)) {
//       if (section._noise_removed > 0) {
//         console.log(`[Filter] ${name}: removed ${section._noise_removed} noisy results, kept ${section.results.length}`);
//       } else {
//         console.log(`[Filter] ${name}: all ${section.results.length} results clean`);
//       }
//       totalRemoved += section._noise_removed;
//     }
//     console.log(`[Filter] Total removed: ${totalRemoved} results`);
  
//     // Flag if ecosystem is empty after filtering — gap detector needs to know
//     // so it can re-run with company name instead of domain as anchor
//     const ecosystemNeedsNameFallback = ecosystem.results.length === 0 &&
//                                         (rawResults.ecosystem?.results?.length || 0) > 0;
  
//     if (ecosystemNeedsNameFallback) {
//       console.log('[Filter] Ecosystem empty after filter — gap detector should retry with company name anchor');
//     }
  
//     return {
//       identity:    { count: identity.results.length,    results: identity.results },
//       funding:     { count: funding.results.length,     results: funding.results },
//       competitors: { count: competitors.results.length, results: competitors.results },
//       team:        { count: team.results.length,        results: team.results },
//       news:        { count: news.results.length,        results: news.results },
//       ecosystem:   { count: ecosystem.results.length,   results: ecosystem.results },
//       _meta: {
//         totalRemoved,
//         ecosystemNeedsNameFallback,
//         anchorsUsed: anchors,
//       },
//     };
//   }


//   function filterGapFill(results, company, domain) {
//     if (!results || results.length === 0) return [];
  
//     const normalizedDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
//     const anchors = buildAnchors(company, normalizedDomain);
  
//     const filtered = results.filter(r => {
//       const title      = r.title || '';
//       const text       = r.text  || '';
//       const highlights = (r.highlights || []).join(' ');
  
//       return (
//         containsAny(title, anchors) ||
//         containsAny(firstChars(text, 500), anchors) ||
//         containsAny(highlights, anchors)
//       );
//     });
  
//     const removed = results.length - filtered.length;
//     if (removed > 0) {
//       console.log(`[Filter] Gap fill: removed ${removed} noisy result(s), kept ${filtered.length}`);
//     }
  
//     return filtered;
//   }
  
  
//   module.exports = { filterNoise, filterGapFill };

// ─────────────────────────────────────────────────────────────
// filterNoise.js — deterministic pre-synthesis noise filter
//
// Runs on raw Exa results BEFORE gap detection and synthesis.
// No LLM, no API calls, no cost. Pure JS string matching.
// Removes contaminated, irrelevant, and spam results so that
// the synthesizer only ever sees clean data or nothing.
//
// Philosophy: it is always better to pass nothing than noise.
// A synthesizer working with sparse clean data produces an
// honest brief. One working with contaminated data hallucinates.
//
// INPUT:  raw { identity, funding, competitors, team, news, ecosystem }
//         company: display name e.g. "Clover Labs"
//         domain:  normalised domain e.g. "cloverlabs.ai"
//
// OUTPUT: filtered { identity, funding, competitors, team, news, ecosystem }
//         Each section has a _noise_removed count for logging.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Check if a string contains ANY of the given needles (case-insensitive)
function containsAny(haystack, needles) {
    if (!haystack || typeof haystack !== 'string') return false;
    const lower = haystack.toLowerCase();
    return needles.some(n => n && lower.includes(n.toLowerCase()));
  }
  
  // Get first N characters of text safely
  function firstChars(text, n) {
    if (!text || typeof text !== 'string') return '';
    return text.slice(0, n);
  }
  
  // Build the full set of anchor strings for a company
  // These are what we look for in result text to confirm relevance
  function buildAnchors(company, domain) {
    const anchors = [];
  
    // Company name variants
    if (company) {
      anchors.push(company.trim());
      // Also try without common suffixes for flexible matching
      anchors.push(company.replace(/\s+(inc\.?|ltd\.?|llc\.?|corp\.?|co\.?)$/i, '').trim());
    }
  
    // Domain variants
    if (domain) {
      const d = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      anchors.push(d);                 // coherehealth.com
      const root = d.split('.')[0];   // coherehealth
      anchors.push(root);
  
      // If root looks like a compound word (no spaces, >8 chars),
      // generate a spaced variant so "coherehealth" also matches "cohere health"
      // in article titles that use the display name rather than the domain.
      // Strategy: try splitting at common boundaries using known prefixes,
      // then fall back to a simple vowel-boundary heuristic.
      if (root.length > 8 && !root.includes('-') && !root.includes('_')) {
        const spaced = splitCompoundWord(root);
        if (spaced && spaced !== root) {
          anchors.push(spaced);
        }
      }
    }
  
    // Deduplicate and remove empty strings
    return [...new Set(anchors.filter(Boolean))];
  }
  
  // Attempt to split a compound domain root into a spaced display name.
  // e.g. "coherehealth" → "cohere health"
  //      "wealthsimple" → "wealth simple"
  //      "cloverlabs"   → "clover labs"
  // Only splits if we can find a clean two-part split at a known boundary.
  // Returns null if no confident split found — better to skip than guess wrong.
  function splitCompoundWord(word) {
    const lower = word.toLowerCase();
  
    // Common second-word suffixes in company names
    const suffixes = [
      'health', 'labs', 'lab', 'care', 'works', 'soft', 'simple',
      'base', 'hub', 'tech', 'ware', 'wire', 'ly', 'ify', 'ai',
      'io', 'app', 'apps', 'cloud', 'pay', 'bank', 'desk', 'flow',
      'force', 'stack', 'side', 'yard', 'house', 'box', 'kit',
      'point', 'mark', 'media', 'link', 'line', 'mind', 'path',
      'ship', 'shop', 'spot', 'spring', 'stone', 'street', 'view',
    ];
  
    for (const suffix of suffixes) {
      if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
        const prefix = lower.slice(0, lower.length - suffix.length);
        // Only accept if prefix is at least 3 chars and looks like a real word
        if (prefix.length >= 3) {
          return `${prefix} ${suffix}`;
        }
      }
    }
  
    return null;
  }
  
  // ─────────────────────────────────────────────────────────────
  // AGGREGATOR PATTERNS — shared between filterCompetitors and filterGapFill
  // ─────────────────────────────────────────────────────────────
  
  const AGGREGATOR_PATTERNS = [
    '/alternatives/',
    '/competitors/',
    '/compare/',
    'hrstacks.com',
    'cbinsights.com',
    'g2.com',
    'capterra.com',
    'technologyadvice.com/blog',
    'getapp.com',
    'softwareadvice.com',
    'trustradius.com',
    'gartner.com/peer-insights',
    'softwareworld.co',
    'sourceforge.net',
    'slashdot.org',
  ];
  
  // ─────────────────────────────────────────────────────────────
  // SECTION FILTERS
  // Each returns { results, _noise_removed }
  // ─────────────────────────────────────────────────────────────
  
  // ── Identity ─────────────────────────────────────────────────
  function filterIdentity(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
    const filtered = results.filter((r, i) => {
      // Always keep result[0] — primary entity card
      if (i === 0) return true;
  
      const url        = r.url || '';
      const title      = r.title || '';
      const summary    = r.summary || '';
      const entityName = r.entities?.[0]?.properties?.name || '';
  
      // Keep if URL is on the company's own domain
      if (domain && url.toLowerCase().includes(domain.toLowerCase())) return true;
  
      // Keep if title mentions company/domain
      if (containsAny(title, anchors)) return true;
  
      // Discard if summary explicitly says it's not about the company
      const notAboutPhrases = [
        'does not contain information about',
        'does not provide information about',
        'not mentioned on',
        'no information available about',
        'cannot describe',
        'not about',
      ];
      if (notAboutPhrases.some(p => summary.toLowerCase().includes(p))) return false;
  
      // Discard if entity name clearly belongs to a different company
      if (entityName && entityName.length > 3) {
        if (!containsAny(entityName, anchors)) return false;
      }
  
      // Default: keep if uncertain
      return true;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ── Funding ───────────────────────────────────────────────────
  function filterFunding(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
    const filtered = results.filter(r => {
      const title      = r.title || '';
      const text       = r.text  || '';
      const highlights = (r.highlights || []).join(' ');
  
      if (containsAny(title, anchors)) return true;
      if (containsAny(firstChars(text, 500), anchors)) return true;
      if (containsAny(firstChars(text, 1000), anchors)) return true;
      if (containsAny(highlights, anchors)) return true;
  
      return false;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ── Competitors ───────────────────────────────────────────────
  function filterCompetitors(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
  
    const filtered = results.filter(r => {
      const url   = (r.url || '').toLowerCase();
      const text  = r.text || '';
      const title = r.title || '';
  
      // Discard if this IS the target company
      if (domain && url.includes(domain.toLowerCase())) return false;
      if (containsAny(title, [company]) && url.includes(domain?.split('.')[0] || '___')) return false;
  
      // Discard if text is essentially empty
      if (!text || text.trim().length < 100) return false;
  
      // Discard known aggregator/comparison URL patterns
      if (AGGREGATOR_PATTERNS.some(p => url.includes(p))) return false;
  
      return true;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ── Team ──────────────────────────────────────────────────────
  function filterTeam(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
  
    const filtered = results.filter(r => {
      const entity      = r.entities?.[0]?.properties;
      const workHistory = entity?.workHistory || [];
      const text        = r.text  || '';
      const title       = r.title || '';
  
      if (workHistory.length === 0) return false;
  
      const currentRole = workHistory[0];
      if (!currentRole?.dates?.from) return false;
  
      const roleCompanyName      = currentRole?.company?.name || '';
      const profileMentionsAnchor = containsAny(title, anchors) ||
                                     containsAny(firstChars(text, 1000), anchors);
      const roleMentionsAnchor    = containsAny(roleCompanyName, anchors);
  
      if (!roleMentionsAnchor && !profileMentionsAnchor) return false;
  
      if (roleCompanyName && containsAny(roleCompanyName, anchors)) {
        const companyLower  = company.toLowerCase();
        const roleNameLower = roleCompanyName.toLowerCase();
        const extraWords    = roleNameLower
          .replace(companyLower, '')
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 2 && !['inc', 'ltd', 'llc', 'corp', 'co', 'the'].includes(w));
  
        if (extraWords.length >= 2) {
          if (domain && !containsAny(firstChars(text, 2000), [domain])) return false;
        }
      }
  
      return true;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ── News ──────────────────────────────────────────────────────
  function filterNews(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
  
    const noiseDomains = [
      'einpresswire.com',
      'uw-media.vcstar.com',
      'www.freep.com/press-release',
      'www.tmnews.com/press-release',
      'www.starcourier.com/press-release',
      'www.thegleaner.com/press-release',
      'hutchnews.com/press-release',
      'www.clarionledger.com/press-release',
      'local.newsbreak.com',
      'newsbreak.com',
    ];
  
    const filtered = results.filter(r => {
      const title          = r.title || '';
      const text           = r.text  || '';
      const url            = (r.url || '').toLowerCase();
      const highlights     = r.highlights || [];
      const firstHighlight = highlights[0] || '';
  
      if (noiseDomains.some(d => url.includes(d))) return false;
      if (text.trim().length < 300) return false;
  
      const titleMatch     = containsAny(title, anchors);
      const textMatch      = containsAny(firstChars(text, 200), anchors);
      const highlightMatch = containsAny(firstHighlight, anchors);
  
      if (!titleMatch && !textMatch && !highlightMatch) return false;
  
      const differentEntityPhrases = [
        'clover health',
        'clover security',
        'cloover',
        'starboard value',
        'starboard maritime',
        'jeff smith',
        'league republic',
        'league sports',
        'leagueapps',
        'league of legends',
        'little league',
        'snow league',
        'premier league',
        'the league dating',
      ];
      if (differentEntityPhrases.some(p => title.toLowerCase().includes(p))) return false;
  
      return true;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ── Ecosystem ─────────────────────────────────────────────────
  function filterEcosystem(results, company, domain, anchors) {
    if (!results || results.length === 0) return { results: [], _noise_removed: 0 };
  
    const original = results.length;
  
    const filtered = results.filter(r => {
      const title      = r.title || '';
      const text       = r.text  || '';
      const highlights = (r.highlights || []).join(' ');
  
      if (text.trim().length < 300) return false;
  
      const titleMatch     = containsAny(title, anchors);
      const textMatch      = containsAny(firstChars(text, 1000), anchors);
      const highlightMatch = containsAny(highlights, anchors);
  
      const matchCount = [titleMatch, textMatch, highlightMatch].filter(Boolean).length;
      if (matchCount < 1) return false;
  
      if (!containsAny(text, anchors)) return false;
  
      const genericPartnershipNoise = [
        'crowdstrike',
        'adobe and nvidia',
        'nvidia announce',
        'servicenow expands openai',
        'openai expands',
        'hcltech and databricks',
        'sopra steria and mistral',
        'kiteworks and kasm',
        'fortinet and arista',
        'carahsoft and servicenow',
      ];
      const titleLower = title.toLowerCase();
      if (genericPartnershipNoise.some(p => titleLower.includes(p))) {
        if (!containsAny(title, anchors)) return false;
      }
  
      return true;
    });
  
    return { results: filtered, _noise_removed: original - filtered.length };
  }
  
  // ─────────────────────────────────────────────────────────────
  // MAIN EXPORT — filterNoise
  // ─────────────────────────────────────────────────────────────
  
  function filterNoise(rawResults, company, domain) {
    const normalizedDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const anchors = buildAnchors(company, normalizedDomain);
  
    console.log(`[Filter] Running noise filter — company: "${company}", domain: "${normalizedDomain}"`);
    console.log(`[Filter] Anchors: ${JSON.stringify(anchors)}`);
  
    const identity    = filterIdentity(rawResults.identity?.results || [], company, normalizedDomain, anchors);
    const funding     = filterFunding(rawResults.funding?.results || [], company, normalizedDomain, anchors);
    const competitors = filterCompetitors(rawResults.competitors?.results || [], company, normalizedDomain, anchors);
    const team        = filterTeam(rawResults.team?.results || [], company, normalizedDomain, anchors);
    const news        = filterNews(rawResults.news?.results || [], company, normalizedDomain, anchors);
    const ecosystem   = filterEcosystem(rawResults.ecosystem?.results || [], company, normalizedDomain, anchors);
  
    const sections = { identity, funding, competitors, team, news, ecosystem };
    let totalRemoved = 0;
    for (const [name, section] of Object.entries(sections)) {
      if (section._noise_removed > 0) {
        console.log(`[Filter] ${name}: removed ${section._noise_removed} noisy results, kept ${section.results.length}`);
      } else {
        console.log(`[Filter] ${name}: all ${section.results.length} results clean`);
      }
      totalRemoved += section._noise_removed;
    }
    console.log(`[Filter] Total removed: ${totalRemoved} results`);
  
    const ecosystemNeedsNameFallback = ecosystem.results.length === 0 &&
                                        (rawResults.ecosystem?.results?.length || 0) > 0;
  
    if (ecosystemNeedsNameFallback) {
      console.log('[Filter] Ecosystem empty after filter — gap detector should retry with company name anchor');
    }
  
    return {
      identity:    { count: identity.results.length,    results: identity.results },
      funding:     { count: funding.results.length,     results: funding.results },
      competitors: { count: competitors.results.length, results: competitors.results },
      team:        { count: team.results.length,        results: team.results },
      news:        { count: news.results.length,        results: news.results },
      ecosystem:   { count: ecosystem.results.length,   results: ecosystem.results },
      _meta: {
        totalRemoved,
        ecosystemNeedsNameFallback,
        anchorsUsed: anchors,
      },
    };
  }
  
  // ─────────────────────────────────────────────────────────────
  // filterGapFill — lightweight anchor + aggregator filter for
  // gap fill results. These bypass the main filterNoise pipeline
  // so we run a minimal check here before they reach the synthesizer.
  // ─────────────────────────────────────────────────────────────
  
  function filterGapFill(results, company, domain) {
    if (!results || results.length === 0) return [];
  
    const normalizedDomain = (domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const anchors = buildAnchors(company, normalizedDomain);
  
    const filtered = results.filter(r => {
      const url        = (r.url || '').toLowerCase();
      const title      = r.title || '';
      const text       = r.text  || '';
      const highlights = (r.highlights || []).join(' ');
  
      // Block aggregator/listicle pages
      if (AGGREGATOR_PATTERNS.some(p => url.includes(p))) return false;
  
      // Must mention an anchor in title, first 500 chars of text, or highlights
      return (
        containsAny(title, anchors) ||
        containsAny(firstChars(text, 500), anchors) ||
        containsAny(highlights, anchors)
      );
    });
  
    const removed = results.length - filtered.length;
    if (removed > 0) {
      console.log(`[Filter] Gap fill: removed ${removed} noisy result(s), kept ${filtered.length}`);
    }
  
    return filtered;
  }
  
  module.exports = { filterNoise, filterGapFill };