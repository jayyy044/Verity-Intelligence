// const Anthropic = require('@anthropic-ai/sdk');

// const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// // ─────────────────────────────────────────────────────────────
// // SYSTEM PROMPT — cached (ephemeral)
// // ─────────────────────────────────────────────────────────────

// const SYSTEM_PROMPT = {
//     type: 'text',
//     text: `You are a private company intelligence analyst for Sagard, a multi-strategy alternative asset manager focused on FinTech, Healthcare, and Technology.
  
//   Your job is to read raw web research results and synthesize them into a structured intelligence report by calling the synthesize_report tool. Every field must be grounded in the provided sources.
  
//   ## Sagard Investment Thesis — use this to score thesis fit
//   - **Target sectors:** FinTech / Financial Services, Healthcare, Technology — but Sagard reviews companies across all sectors
//   - **Strategies:** VC (early/growth-stage), PE (profitable small/mid-market buyouts), Credit (direct lending, asset-backed, cash-flowing)
//   - **Geography:** North American focus
//   - **Stage signals:** VC = pre-revenue to ~$50M ARR | PE = profitable, small/mid-market scale (sub-$500M valuation typical) | Credit = asset-backed or cash-flowing
  
//   ## Field-by-field instructions
  
//   ### company
//   - description: one sentence max — what the company does, for whom, how it makes money
//   - business_model: describe how the company makes money in 2–4 words. Examples: "B2B SaaS", "B2C subscription", "B2B2C platform", "Transaction fees", "Usage-based SaaS", "D2C e-commerce", "Professional services", "Marketplace". Use whatever label best fits — don't force it into a preset category.
//   - sector: the primary industry the company operates in. Examples: "FinTech", "Healthcare", "Technology", "Real Estate", "Energy", "Consumer", "Logistics", "EdTech", "CleanTech", "Media", "Manufacturing". Use the most accurate label for what the company does.
//   - vertical: the specific sub-sector or niche. Examples: "Wealth Management", "Digital Health", "Payments Infrastructure", "Supply Chain", "HR Tech", "Cybersecurity", "Insurtech", "Legal Tech", "AgriTech". Be specific.
  
//   ### funding
//   - total_raised: sum all rounds if multiple are mentioned, format as "$XM" or "$XB" — "Undisclosed" if nothing found
//   - last_round.series: the most recent round label as it appears in the sources. Examples: "Seed", "Series A", "Series C", "Growth Equity", "Venture Round", "Debt Financing". Use the exact label from the source.
//   - key_investors: top 3–4 names only — pick the most recognizable
//   - ownership_type: describe the ownership structure based on what is in the sources. Examples: "Founder-led", "VC-backed", "PE-backed", "PE-backed (founder retained)", "Family-owned", "Publicly traded", "Subsidiary". Use whatever fits.
  
//   ### competitive
//   - market_position: describe the company's competitive standing based on signals in the sources — market share, AUM, user count, revenue rank, stated positioning. Examples: "Market leader in Canada", "Challenger to incumbent banks", "Early-stage, niche focus", "Dominant in SMB segment", "Fast follower in enterprise". Be specific to what the sources say.
//   - direct_competitors: 3–5 companies. differentiator = one line describing how THEY differ FROM the target company — not what they do generally
  
//   ### team
//   - ceo_name + ceo_background: 1–2 sentences — prior roles, education, notable achievements
//   - founder_names: all named co-founders found in the sources
  
//   ### news
//   - sentiment: overall tone across all news items — must be exactly one of: Positive | Neutral | Negative
//   - summary: 2–3 sentence analyst-style narrative. Synthesize the tone and themes: what momentum signals exist, any risks or headwinds mentioned, what it signals about the company's trajectory. This is the paragraph shown in the News & Sentiment panel.
//   - recent_events: up to 4 strings, each one specific event from the last 12 months. Format: what happened + brief significance. Include date context if available.
  
//   ### fit_score
//   - score: must be exactly one of: Strong | Moderate | Weak
//   - sector_match: which of Sagard's core sectors this maps to. If it fits one of their target sectors write that (e.g. "FinTech", "Healthcare", "Technology"). If it is adjacent write the actual sector (e.g. "Real Estate", "Consumer", "Logistics"). If there is no meaningful fit write "None".
//   - strategy_match: which Sagard strategy fits best — VC | PE | Credit | None. Use the stage signals above to decide. Critical rules:
//     - PE match requires the company to be a realistic buyout candidate — profitable AND small/mid-market scale (sub-$500M valuation typical). A company with a $1B+ valuation is NOT a PE target regardless of profitability — use "VC" for late-stage growth companies still scaling.
//     - VC match = early or growth-stage companies, typically pre-IPO, scaling revenue, may or may not be profitable yet.
//     - Credit match = companies with predictable cash flows or hard assets suitable for direct lending.
//     - When in doubt between VC and PE, ask: could Sagard realistically acquire a controlling stake? If the valuation makes that implausible, it's VC.
//   - geography: primary market label derived from the sources. Examples: "Canada", "USA", "North America", "UK", "Europe", "Global", "LATAM"
//   - rationale: 2–3 sentences, analyst tone, specific — connect sector alignment, stage/strategy fit, and standout signals. The most important field. Be specific, not generic.
  
//   ### ecosystem.nodes — must include ALL of these:
//   - One node type "target" — the company itself
//   - One node per direct competitor, type "competitor"
//   - 2–4 nodes type "ecosystem" — key partners, investors, distribution channels, or adjacent players named in the sources
//   - One node type "sagard", name "Sagard"
//     - If Sagard is named as an investor in any funding source, set relationship to "Prior investor" and note the round if available (e.g. "Prior investor — 2021 round")
//     - If Sagard is NOT named as an investor in any source, set relationship to "Potential investor"
  
//   ### confidence
//   - must be exactly one of: High | Medium | Low
//   - High = most fields sourced from primary sources (press releases, company site, named publications)
//   - Medium = mix of primary and secondary sources, some inference required
//   - Low = sparse data, significant inference required
//   - confidence_note: one sentence on what was strong and what was weak
  
//   ### market (Tier 2)
//   - tam_estimate: if a market size figure is mentioned in the sources, use it formatted as "$XB" or "$XM". null if not found — do not estimate.
//   - tailwinds: 2–3 short phrases describing macro or sector trends working IN FAVOUR of the company. You may infer from industry context if not explicitly stated. [] if nothing reasonable.
//   - headwinds: 2–3 short phrases describing risks or trends working AGAINST the company. [] if nothing reasonable.
  
//   ### Other Tier 2 fields
//   - headcount: string like "1,200+" or "~500" or "50–100" if mentioned in sources, null if not
//   - revenue_stage: scan ALL sources carefully for any profitability or revenue signal — words like "profitable", "cash-flowing", "revenue growth", "ARR", "recurring revenue" anywhere in the text count. Use the most informative label found. Examples: "Pre-revenue", "<$1M ARR", "$1–10M ARR", "$10–50M ARR", "$50M+ ARR", "Profitable", "Undisclosed". null only if there is genuinely zero signal anywhere in the sources.
//   - moat_signals: short strings describing defensibility signals found in or inferable from the sources. Examples: "Network effects from 3M+ user base", "Proprietary data advantage", "High switching costs for enterprise clients", "Regulatory moat via banking licence". [] if none.
//   - leadership_changes: true only if a named leadership change is mentioned in the last 12 months. false otherwise.
//   - key_partnerships: named partners from the sources as short strings. Examples: "Broadridge (distribution)", "Power Corporation (strategic investor)", "Visa (network partner)". [] if none found.
  
//   ## Hard rules
//   - Never fabricate funding amounts, investor names, or competitor names
//   - Never leave a required field blank — use the specified fallback
//   - Never score "Strong" thesis fit unless sector AND strategy both clearly align with Sagard's thesis
//   - For the three UI display fields (sentiment, score, confidence) — use only the exact values specified. Everything else is open.`,
//     cache_control: { type: 'ephemeral' },
// };

// // ─────────────────────────────────────────────────────────────
// // TOOL DEFINITION
// // ─────────────────────────────────────────────────────────────

// const SYNTHESIZE_TOOL = {
//   name: 'synthesize_report',
//   description: 'Output a structured intelligence report for a private company',
//   input_schema: {
//     type: 'object',
//     required: [
//       'company', 'funding', 'competitive', 'team', 'news',
//       'fit_score', 'ecosystem', 'confidence', 'confidence_note',
//       'headcount', 'revenue_stage', 'market',
//       'moat_signals', 'leadership_changes', 'key_partnerships',
//     ],
//     properties: {

//       // ── TIER 1 ──────────────────────────────────────────────

//       company: {
//         type: 'object',
//         required: ['name', 'website', 'hq', 'founded', 'description', 'business_model', 'sector', 'vertical'],
//         properties: {
//           name:           { type: 'string' },
//           website:        { type: 'string' },
//           hq:             { type: 'string' },
//           founded:        { type: 'string' },
//           description:    { type: 'string', description: 'One sentence max' },
//           business_model: { type: 'string', description: 'How the company makes money — e.g. "B2B SaaS", "B2C subscription", "Transaction fees", "Marketplace". Use the most accurate label.' },
//           sector:         { type: 'string', description: 'Primary industry — e.g. "FinTech", "Healthcare", "Technology", "Logistics", "Consumer", "CleanTech". Use the most accurate label.' },
//           vertical:       { type: 'string' },
//         },
//       },

//       funding: {
//         type: 'object',
//         required: ['total_raised', 'last_round', 'key_investors', 'ownership_type'],
//         properties: {
//           total_raised: { type: 'string' },
//           last_round: {
//             type: 'object',
//             required: ['series', 'amount', 'date'],
//             properties: {
//               series: { type: 'string' },
//               amount: { type: 'string' },
//               date:   { type: 'string' },
//             },
//           },
//           key_investors:  { type: 'array', items: { type: 'string' }, maxItems: 4 },
//           ownership_type: { type: 'string', description: 'Ownership structure — e.g. "Founder-led", "VC-backed", "PE-backed", "Family-owned", "Publicly traded", "Subsidiary".' },
//         },
//       },

//       competitive: {
//         type: 'object',
//         required: ['market_position', 'direct_competitors'],
//         properties: {
//           market_position: { type: 'string', description: 'Competitive standing based on source signals — e.g. "Market leader in Canada", "Challenger to incumbent banks", "Early-stage niche player", "Dominant in SMB segment".' },
//           direct_competitors: {
//             type: 'array',
//             minItems: 1,
//             maxItems: 5,
//             items: {
//               type: 'object',
//               required: ['name', 'differentiator'],
//               properties: {
//                 name:           { type: 'string' },
//                 differentiator: { type: 'string' },
//               },
//             },
//           },
//         },
//       },

//       team: {
//         type: 'object',
//         required: ['ceo_name', 'ceo_background', 'founder_names'],
//         properties: {
//           ceo_name:       { type: 'string' },
//           ceo_background: { type: 'string' },
//           founder_names:  { type: 'array', items: { type: 'string' } },
//         },
//       },

//       news: {
//         type: 'object',
//         required: ['sentiment', 'summary', 'recent_events'],
//         properties: {
//           sentiment: {
//             type: 'string',
//             enum: ['Positive', 'Neutral', 'Negative'],
//           },
//           summary: {
//             type: 'string',
//             description: '2–3 sentence analyst narrative synthesizing tone, momentum, and trajectory across all news items',
//           },
//           recent_events: {
//             type: 'array',
//             maxItems: 4,
//             items: { type: 'string' },
//             description: 'Up to 4 specific events from last 12 months — one sentence each: what happened + significance',
//           },
//         },
//       },

//       fit_score: {
//         type: 'object',
//         required: ['score', 'sector_match', 'strategy_match', 'geography', 'rationale'],
//         properties: {
//           score:          { type: 'string', enum: ['Strong', 'Moderate', 'Weak'] },
//           sector_match:   { type: 'string', description: 'Sagard sector match — use "FinTech", "Healthcare", or "Technology" if it fits. Otherwise write the actual sector (e.g. "Real Estate", "Consumer"). Write "None" if no fit.' },
//           strategy_match: { type: 'string', enum: ['VC', 'PE', 'Credit', 'None'] },
//           geography:      { type: 'string' },
//           rationale:      { type: 'string' },
//         },
//       },

//       ecosystem: {
//         type: 'object',
//         required: ['nodes'],
//         properties: {
//           nodes: {
//             type: 'array',
//             minItems: 3,
//             items: {
//               type: 'object',
//               required: ['name', 'type', 'relationship'],
//               properties: {
//                 name:         { type: 'string' },
//                 type:         { type: 'string', enum: ['target', 'competitor', 'ecosystem', 'sagard'] },
//                 relationship: { type: 'string' },
//               },
//             },
//           },
//         },
//       },

//       confidence:      { type: 'string', enum: ['High', 'Medium', 'Low'] },
//       confidence_note: { type: 'string' },

//       // ── TIER 2 ──────────────────────────────────────────────

//       headcount:     { type: ['string', 'null'] },
//       revenue_stage: {
//         type: ['string', 'null'],
//         description: 'Revenue scale label if signal found — e.g. "Pre-revenue", "<$1M ARR", "$1–10M ARR", "$10–50M ARR", "$50M+ ARR", "Profitable", "Undisclosed". null if no signal.',
//       },

//       market: {
//         type: 'object',
//         required: ['tam_estimate', 'tailwinds', 'headwinds'],
//         properties: {
//           tam_estimate: { type: ['string', 'null'] },
//           tailwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
//           headwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
//         },
//       },

//       moat_signals:       { type: 'array', items: { type: 'string' } },
//       leadership_changes: { type: 'boolean' },
//       key_partnerships:   { type: 'array', items: { type: 'string' } },
//     },
//   },
// };

// // ─────────────────────────────────────────────────────────────
// // DEFAULT FALLBACK
// // ─────────────────────────────────────────────────────────────

// function buildDefaultReport(company) {
//   return {
//     company: {
//       name: company,
//       website: 'Insufficient data',
//       hq: 'Insufficient data',
//       founded: 'Insufficient data',
//       description: 'Insufficient data',
//       business_model: 'Other',
//       sector: 'Other',
//       vertical: 'Insufficient data',
//     },
//     funding: {
//       total_raised: 'Undisclosed',
//       last_round: { series: 'Insufficient data', amount: 'Insufficient data', date: 'Insufficient data' },
//       key_investors: [],
//       ownership_type: 'Unknown',
//     },
//     competitive: { market_position: 'Niche', direct_competitors: [] },
//     team: { ceo_name: 'Insufficient data', ceo_background: 'Insufficient data', founder_names: [] },
//     news: {
//       sentiment: 'Neutral',
//       summary: 'Insufficient data to assess news signals.',
//       recent_events: [],
//     },
//     fit_score: {
//       score: 'Weak',
//       sector_match: 'None',
//       strategy_match: 'None',
//       geography: 'Unknown',
//       rationale: 'Synthesis failed — insufficient data to assess thesis fit.',
//     },
//     ecosystem: {
//       nodes: [
//         { name: company, type: 'target', relationship: 'Target company under evaluation' },
//         { name: 'Sagard', type: 'sagard', relationship: 'Potential investor' },
//       ],
//     },
//     confidence: 'Low',
//     confidence_note: 'Synthesis failed — raw data returned.',
//     headcount: null,
//     revenue_stage: null,
//     market: { tam_estimate: null, tailwinds: [], headwinds: [] },
//     moat_signals: [],
//     leadership_changes: false,
//     key_partnerships: [],
//   };
// }

// // ─────────────────────────────────────────────────────────────
// // CONTEXT BUILDER
// // Funding gets 600-char previews (highest hallucination risk).
// // News sources use highlights when available — more signal-dense.
// // ─────────────────────────────────────────────────────────────

// function buildResearchContext(company, pipelineOutput) {
//   const { results } = pipelineOutput;
//   const lines = [];

//   lines.push(`## Company Under Analysis: "${company}"\n`);

//   if (results.callA.companyProfile.results.length > 0) {
//     lines.push('## Company Profile Sources');
//     results.callA.companyProfile.results.forEach((r, i) => {
//       lines.push(`[Profile ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//     });
//   }

//   if (results.callA.funding.results.length > 0) {
//     lines.push('## Funding & Investor Sources');
//     results.callA.funding.results.forEach((r, i) => {
//       lines.push(`[Funding ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//     });
//   }

//   if (results.callA.competitors.results.length > 0) {
//     lines.push('## Competitor Sources');
//     results.callA.competitors.results.forEach((r, i) => {
//       lines.push(`[Competitor ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//     });
//   }

//   if (results.callA.ecosystem.results.length > 0) {
//     lines.push('## Ecosystem & Partnership Sources');
//     results.callA.ecosystem.results.forEach((r, i) => {
//       lines.push(`[Ecosystem ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//     });
//   }

//   if (results.callB.news.results.length > 0) {
//     lines.push('## News Sources (last 12 months)');
//     results.callB.news.results.forEach((r, i) => {
//       const date = r.published ? ` [${r.published}]` : '';
//       // Highlights are more signal-dense than plain previews — prefer them
//       const body = r.highlights?.join(' ... ') || r.preview || '';
//       lines.push(`[News ${i + 1}]${date} ${r.title}\n${r.url}\n${body}\n`);
//     });
//   }

//   if (results.callB.founders.results.length > 0) {
//     lines.push('## Team & Leadership Sources');
//     results.callB.founders.results.forEach((r, i) => {
//       lines.push(`[Team ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//     });
//   }

//   if (results.gapFill?.results?.length > 0) {
//     lines.push('## Supplemental Research (Gap Fill)');
//     results.gapFill.results.forEach((gap, i) => {
//       lines.push(`### Gap query: "${gap.query}"`);
//       gap.results.forEach((r, j) => {
//         lines.push(`[Gap ${i + 1}.${j + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
//       });
//     });
//   }

//   if (pipelineOutput.gap_detection?.confidence) {
//     const c = pipelineOutput.gap_detection.confidence;
//     lines.push('## Research Quality Signals');
//     lines.push(
//       `company_profile: ${c.company_profile} | funding: ${c.funding} | competitors: ${c.competitors} | news: ${c.news} | founders: ${c.founders} | ecosystem: ${c.ecosystem}`
//     );
//     if (pipelineOutput.gap_detection.notes) {
//       lines.push(`Note: ${pipelineOutput.gap_detection.notes}`);
//     }
//   }

//   return lines.join('\n');
// }

// // ─────────────────────────────────────────────────────────────
// // MAIN EXPORT
// // ─────────────────────────────────────────────────────────────

// async function synthesize(company, pipelineOutput) {
//   console.log(`[Synthesizer] Starting synthesis for: ${company}`);

//   const researchContext = buildResearchContext(company, pipelineOutput);

//   const userMessage = `Synthesize the research below into an intelligence report for "${company}" by calling the synthesize_report tool.

// ${researchContext}

// Instructions:
// - Ground every field in the sources above — no fabrication
// - Use fallback values (null, [], "Undisclosed", "Insufficient data") for anything not found
// - news.summary and fit_score.rationale are the two most important fields — write them as a senior analyst would
// - For tailwinds/headwinds: 2–3 short phrases each. You may infer from industry context if not explicitly stated.`;

//   let response;

//   try {
//     response = await claude.messages.create({
//       model: 'claude-sonnet-4-20250514',
//       max_tokens: 4000,
//       system: [SYSTEM_PROMPT],
//       tools: [SYNTHESIZE_TOOL],
//       tool_choice: { type: 'tool', name: 'synthesize_report' },
//       messages: [{ role: 'user', content: userMessage }],
//     });
//   } catch (err) {
//     console.error('[Synthesizer] Claude API call failed:', err.message);
//     return buildDefaultReport(company);
//   }

//   const toolBlock = response.content.find(b => b.type === 'tool_use');

//   if (!toolBlock?.input) {
//     console.error('[Synthesizer] No tool call returned — using default report');
//     return buildDefaultReport(company);
//   }

//   const report = toolBlock.input;

//   // Always ensure Sagard node exists
//   const hasSagard = report.ecosystem?.nodes?.some(n => n.type === 'sagard');
//   if (!hasSagard) {
//     report.ecosystem.nodes.push({
//       name: 'Sagard',
//       type: 'sagard',
//       relationship: 'Potential investor',
//     });
//   }

//   const u = response.usage;
//   if (u) {
//     console.log(`[Synthesizer] Tokens — input: ${u.input_tokens}, output: ${u.output_tokens}`);
//     if (u.cache_read_input_tokens > 0) {
//       console.log(`[Synthesizer] Cache hit — saved ${u.cache_read_input_tokens} tokens`);
//     } else if (u.cache_creation_input_tokens > 0) {
//       console.log(`[Synthesizer] Cache written — ${u.cache_creation_input_tokens} tokens`);
//     }
//   }

//   console.log(`[Synthesizer] Done — score: ${report.fit_score?.score}, confidence: ${report.confidence}`);
//   console.log(`[Synthesizer] Nodes: ${report.ecosystem?.nodes?.length} | Competitors: ${report.competitive?.direct_competitors?.length}`);

//   return report;
// }

// module.exports = { synthesize };

const Anthropic = require('@anthropic-ai/sdk');
const fs        = require('fs');
const path      = require('path');

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// PORTFOLIO — loaded once at startup
// Used for deterministic JS pre-check before the Claude call.
// Claude never has to scan 129 companies in its head — we do it
// here and hand it the findings.
// ─────────────────────────────────────────────────────────────

function loadPortfolio() {
  const filePath = path.join(__dirname, '../test', 'companies.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const PORTFOLIO = loadPortfolio();

// Normalise a string for fuzzy matching — strip protocol, punctuation, lowercase
function normalise(str) {
  return (str || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]/g, '');
}

// Build lookup index once at startup
const PORTFOLIO_INDEX = PORTFOLIO.map(c => ({
  raw:  c,
  name: normalise(c.name),
  url:  normalise(c.url),
}));

// Return first portfolio entry whose normalised name or domain appears in `text`
function findPortfolioMatch(text) {
  const norm = normalise(text);
  return PORTFOLIO_INDEX.find(p =>
    p.name.length > 3 && (norm.includes(p.name) || (p.url.length > 4 && norm.includes(p.url)))
  ) || null;
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO PRE-CHECK (pure JS, runs before Claude call)
//
// Checks:
//   1. Is the target company itself already in the Sagard portfolio?
//   2. Do any named competitors match a portfolio company?
//   3. Do any named ecosystem / partner results match a portfolio company?
// ─────────────────────────────────────────────────────────────

function checkPortfolioOverlap(site, filtered, gapFill, ecosystemFallback) {
  const findings = {
    target_in_portfolio: null,  // portfolio entry object if found
    competitor_matches:  [],    // [{ competitor_name, portfolio_company }]
    ecosystem_matches:   [],    // [{ partner_name, portfolio_company }]
  };

  // 1. Target itself
  const siteNorm = normalise(site);
  const targetHit = PORTFOLIO_INDEX.find(p =>
    p.url.length > 4 && (p.url.includes(siteNorm) || siteNorm.includes(p.url))
  );
  if (targetHit) findings.target_in_portfolio = targetHit.raw;

  // 2. Competitors
  for (const r of (filtered?.competitors?.results || [])) {
    const match = findPortfolioMatch(`${r.title || ''} ${r.url || ''}`);
    if (match && !findings.competitor_matches.find(m => m.portfolio_company === match.raw.name)) {
      findings.competitor_matches.push({
        competitor_name:   r.title,
        portfolio_company: match.raw.name,
      });
    }
  }

  // 3. Ecosystem + fallback + gap fill results
  const ecoSources = [
    ...(filtered?.ecosystem?.results || []),
    ...(ecosystemFallback?.results   || []),
    ...(gapFill?.results?.flatMap(g => g.results || []) || []),
  ];
  for (const r of ecoSources) {
    const match = findPortfolioMatch(`${r.title || ''} ${r.url || ''}`);
    if (match && !findings.ecosystem_matches.find(m => m.portfolio_company === match.raw.name)) {
      findings.ecosystem_matches.push({
        partner_name:      r.title,
        portfolio_company: match.raw.name,
      });
    }
  }

  return findings;
}

function formatPortfolioFindings(findings) {
  const lines = ['## Sagard Portfolio Cross-Reference (pre-computed — use this to write portfolio_context)'];

  if (findings.target_in_portfolio) {
    lines.push(`TARGET ALREADY IN PORTFOLIO: "${findings.target_in_portfolio.name}" is a current Sagard portfolio company.`);
  } else {
    lines.push('Target company: not currently in Sagard portfolio.');
  }

  if (findings.competitor_matches.length > 0) {
    lines.push('Competitor overlaps with portfolio:');
    findings.competitor_matches.forEach(m =>
      lines.push(`  - Competitor "${m.competitor_name}" matches Sagard portfolio company "${m.portfolio_company}"`)
    );
  } else {
    lines.push('Competitor overlaps: none identified.');
  }

  if (findings.ecosystem_matches.length > 0) {
    lines.push('Ecosystem / partner overlaps with portfolio:');
    findings.ecosystem_matches.forEach(m =>
      lines.push(`  - Partner/ecosystem result "${m.partner_name}" matches Sagard portfolio company "${m.portfolio_company}"`)
    );
  } else {
    lines.push('Ecosystem overlaps: none identified.');
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — cached
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = {
  type: 'text',
  text: `You are a private company intelligence analyst for Sagard, a multi-strategy alternative asset manager focused on FinTech, Healthcare, and Technology.

Your job is to read web research results and synthesize them into a structured intelligence report by calling the synthesize_report tool. Every field must be grounded in the provided sources.

## Data source priority — when sources conflict, follow this order:
1. Structured entity card (Exa metadata) — most reliable for headcount, funding totals, HQ, founded year
2. Gap fill results — targeted and clean, prefer for funding amounts and CEO identity
3. Filtered sections — broader, noise-filtered
4. Infer from industry context only when all three are silent — never fabricate

## Sagard Investment Thesis
- Target sectors: FinTech / Financial Services, Healthcare, Technology
- Strategies: VC (early/growth-stage) | PE (profitable, sub-$500M valuation buyout) | Credit (asset-backed or cash-flowing)
- Geography: North American focus, some European exposure

## Field instructions

### identity
- name: company display name
- website: domain
- hq: city, country
- founded: year as string
- description: one sentence — what they do, for whom, how they make money
- business_model: 2–4 words. e.g. "B2B SaaS", "Transaction fees", "B2C subscription", "Marketplace"
- sector: e.g. "FinTech", "Healthcare", "Technology", "Consumer", "Logistics"
- vertical: specific niche. e.g. "Wealth Management", "Prior Authorization AI", "Payments Infrastructure"
- headcount: "~350" or "1,200+" or null if not found
- revenue_stage: use ONLY one of these exact values:
  "Pre-revenue" | "<$1M ARR" | "$1–10M ARR" | "$10–50M ARR" | "$50M+ ARR" | "Profitable" | "Undisclosed" | null
  Use "$50M+ ARR" for any revenue above $50M. Note the actual figure in confidence.note if known.

### funding
- total_raised: "$XM" or "$XB". "Undisclosed" if nothing found.
- last_round.series: exact label from source — "Seed", "Series C", "Growth Equity" etc.
- key_investors: top 3–4 most recognizable names only
- ownership_type: "Founder-led" | "VC-backed" | "PE-backed" | "PE-backed (founder retained)" | "Publicly traded" | "Family-owned" | describe accurately
- IMPORTANT: The entity card fundingTotal is your funding anchor. Discard any source reporting figures dramatically higher (5x+) than the anchor — it is likely contamination from a different company.
- If gap fill sources contain funding data, prefer that over the filtered funding section.
- Majority ownership by a family holding company, sovereign wealth fund, or strategic corporate investor does not mean PE-backed — use 'VC-backed' or describe the actual structure accurately.

### team
- ceo_name: full name
- ceo_background: 1–2 sentences — prior roles, education, notable achievements
- founder_names: all named co-founders found in sources
- If gap fill sources name a CEO or founder, use those — more reliable than team section results.

### competitive
- market_position: signal-based label. e.g. "Market leader in Canada", "Early-stage niche player", "Dominant in SMB payments"
- direct_competitors: 3–5 entries. differentiator = one line on how THEY differ FROM the target.

### market
- tailwinds: 2–3 short phrases — trends working in the company's favour. May infer from industry context.
- headwinds: 2–3 short phrases — risks working against them. May infer from industry context.
- tam_estimate: market size figure from sources as "$XB" or "$XM". null if not stated — do NOT estimate.

### news
- sentiment: exactly "Positive" | "Neutral" | "Negative"
- summary: 2–3 sentence analyst narrative — tone, themes, momentum, trajectory
- recent_events: up to 4 objects with { date, event }. date = "Q1 2025" or "March 2025". event = what happened + brief significance.

### defensibility
- moat_signals: short strings describing competitive defensibility. [] if none found.
- key_partnerships: named partners as short strings e.g. "Visa (network partner)". [] if none.
- leadership_changes: null if no named change in last 12 months. Otherwise one line: "CEO X replaced by Y, Month Year".

### ecosystem.nodes
- One node per direct competitor (type "competitor") — only competitors explicitly named in sources
- 0–4 nodes for named partners, investors, or adjacent players (type "ecosystem") — only from sources, never invented
- Do NOT include a node for the target company itself
- Returning only competitor nodes or even an empty array is correct when data is sparse. Never fabricate.

### fit_score
- score: "Strong" | "Moderate" | "Weak". Never "Strong" unless sector AND strategy both clearly align.
- sector_match: "FinTech" | "Healthcare" | "Technology" if it fits Sagard's core focus. Otherwise write the actual sector. "None" if no fit.
- strategy_match — follow this decision order exactly, stop at first match:
  1. Valuation known to be above $500M → "VC". Stop.
  2. Asset-backed or hard-asset cash flows suitable for direct lending → "Credit". Stop.
  3. ownership_type is VC-backed OR last round is Seed/Series A/B/C/D → "VC". Stop.
  4. Profitable AND ownership_type is PE-backed or taken private → "PE". Stop.
  5. Early or growth-stage, scaling revenue → "VC".
  6. No clear signal → "None".
  NEVER assign "PE" to a VC-backed company regardless of revenue or profitability.
- geography: "Canada" | "USA" | "North America" | "Europe" | "Global" etc.
- rationale: 2–3 sentences, analyst tone. Connect sector alignment, stage fit, and standout signals. Be specific to this company — not generic.
- portfolio_context: one sentence derived from the pre-computed portfolio cross-reference provided in the research context. State what was found and what it means for fit. If nothing found: "No direct portfolio overlap identified."
- "If the portfolio cross-reference shows the target is already a Sagard portfolio company, set strategy_match to 'None' and note this in rationale.

### confidence
- score: "High" | "Medium" | "Low"
- note: one sentence on what was strong and what was weak or missing in the research

## Hard rules
- Never fabricate funding amounts, investor names, competitor names, or ecosystem partners
- Never leave a required field empty — use null, [], or "Undisclosed" as appropriate
- revenue_stage — use only the exact enum values listed above, no variations
- For sentiment, fit_score.score, confidence.score — exact enum values only`,
  cache_control: { type: 'ephemeral' },
};

// ─────────────────────────────────────────────────────────────
// TOOL DEFINITION — matches target frontend schema exactly
// Each top-level key = one frontend component
// ─────────────────────────────────────────────────────────────

const SYNTHESIZE_TOOL = {
  name: 'synthesize_report',
  description: 'Output a structured intelligence report for a private company',
  input_schema: {
    type: 'object',
    required: ['identity', 'funding', 'team', 'competitive', 'market', 'news', 'defensibility', 'ecosystem', 'fit_score', 'confidence'],
    properties: {

      identity: {
        type: 'object',
        required: ['name', 'website', 'hq', 'founded', 'description', 'business_model', 'sector', 'vertical', 'headcount', 'revenue_stage'],
        properties: {
          name:           { type: 'string' },
          website:        { type: 'string' },
          hq:             { type: 'string' },
          founded:        { type: 'string' },
          description:    { type: 'string' },
          business_model: { type: 'string' },
          sector:         { type: 'string' },
          vertical:       { type: 'string' },
          headcount:      { type: ['string', 'null'] },
          revenue_stage:  {
            type: ['string', 'null'],
            enum: ['Pre-revenue', '<$1M ARR', '$1–10M ARR', '$10–50M ARR', '$50M+ ARR', 'Profitable', 'Undisclosed', null],
          },
        },
      },

      funding: {
        type: 'object',
        required: ['total_raised', 'last_round', 'key_investors', 'ownership_type'],
        properties: {
          total_raised:   { type: 'string' },
          last_round: {
            type: 'object',
            required: ['series', 'amount', 'date'],
            properties: {
              series: { type: 'string' },
              amount: { type: 'string' },
              date:   { type: 'string' },
            },
          },
          key_investors:  { type: 'array', items: { type: 'string' }, maxItems: 4 },
          ownership_type: { type: 'string' },
        },
      },

      team: {
        type: 'object',
        required: ['ceo_name', 'ceo_background', 'founder_names'],
        properties: {
          ceo_name:       { type: 'string' },
          ceo_background: { type: 'string' },
          founder_names:  { type: 'array', items: { type: 'string' } },
        },
      },

      competitive: {
        type: 'object',
        required: ['market_position', 'direct_competitors'],
        properties: {
          market_position: { type: 'string' },
          direct_competitors: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            items: {
              type: 'object',
              required: ['name', 'differentiator'],
              properties: {
                name:           { type: 'string' },
                differentiator: { type: 'string' },
              },
            },
          },
        },
      },

      market: {
        type: 'object',
        required: ['tailwinds', 'headwinds', 'tam_estimate'],
        properties: {
          tailwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
          headwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
          tam_estimate: { type: ['string', 'null'] },
        },
      },

      news: {
        type: 'object',
        required: ['sentiment', 'summary', 'recent_events'],
        properties: {
          sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative'] },
          summary:   { type: 'string' },
          recent_events: {
            type: 'array',
            maxItems: 4,
            items: {
              type: 'object',
              required: ['date', 'event'],
              properties: {
                date:  { type: 'string' },
                event: { type: 'string' },
              },
            },
          },
        },
      },

      defensibility: {
        type: 'object',
        required: ['moat_signals', 'key_partnerships', 'leadership_changes'],
        properties: {
          moat_signals:       { type: 'array', items: { type: 'string' } },
          key_partnerships:   { type: 'array', items: { type: 'string' } },
          leadership_changes: {
            type: ['string', 'null'],
            description: 'null if no change in last 12 months. Otherwise: "CEO X replaced by Y, Month Year".',
          },
        },
      },

      ecosystem: {
        type: 'object',
        required: ['nodes'],
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'relationship'],
              properties: {
                name:         { type: 'string' },
                type:         { type: 'string', enum: ['competitor', 'ecosystem'] },
                relationship: { type: 'string' },
              },
            },
          },
        },
      },

      fit_score: {
        type: 'object',
        required: ['score', 'sector_match', 'strategy_match', 'geography', 'rationale', 'portfolio_context'],
        properties: {
          score:             { type: 'string', enum: ['Strong', 'Moderate', 'Weak'] },
          sector_match:      { type: 'string' },
          strategy_match:    { type: 'string', enum: ['VC', 'PE', 'Credit', 'None'] },
          geography:         { type: 'string' },
          rationale:         { type: 'string' },
          portfolio_context: { type: 'string' },
        },
      },

      confidence: {
        type: 'object',
        required: ['score', 'note'],
        properties: {
          score: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          note:  { type: 'string' },
        },
      },

    },
  },
};

// ─────────────────────────────────────────────────────────────
// DEFAULT FALLBACK
// ─────────────────────────────────────────────────────────────

function buildDefaultReport(site) {
  return {
    identity: {
      name: site, website: site, hq: 'Unknown', founded: 'Unknown',
      description: 'Insufficient data', business_model: 'Unknown',
      sector: 'Unknown', vertical: 'Unknown',
      headcount: null, revenue_stage: null,
    },
    funding: {
      total_raised: 'Undisclosed',
      last_round: { series: 'Unknown', amount: 'Unknown', date: 'Unknown' },
      key_investors: [], ownership_type: 'Unknown',
    },
    team: { ceo_name: 'Unknown', ceo_background: 'Insufficient data', founder_names: [] },
    competitive: { market_position: 'Unknown', direct_competitors: [] },
    market: { tailwinds: [], headwinds: [], tam_estimate: null },
    news: { sentiment: 'Neutral', summary: 'Insufficient data.', recent_events: [] },
    defensibility: { moat_signals: [], key_partnerships: [], leadership_changes: null },
    ecosystem: { nodes: [] },
    fit_score: {
      score: 'Weak', sector_match: 'None', strategy_match: 'None',
      geography: 'Unknown',
      rationale: 'Synthesis failed — insufficient data.',
      portfolio_context: 'Portfolio analysis unavailable.',
    },
    confidence: { score: 'Low', note: 'Synthesis failed — no data available.' },
  };
}

// ─────────────────────────────────────────────────────────────
// CONTEXT BUILDER
// ─────────────────────────────────────────────────────────────

function firstChars(text, n) {
  if (!text || typeof text !== 'string') return '';
  return text.slice(0, n);
}

function buildResearchContext(reSearched, portfolioFindings) {
  const lines = [];
  const { site, filtered, gap_fill, ecosystem_fallback, gap_detection } = reSearched;

  lines.push(`## Company Under Analysis: "${site}"\n`);

  // Portfolio findings always first — Claude uses this for portfolio_context
  lines.push(formatPortfolioFindings(portfolioFindings));
  lines.push('');

  // Entity card
  const entityCard = filtered?.identity?.results?.[0]?.entities?.[0]?.properties;
  if (entityCard) {
    lines.push('## Structured Entity Data (highest reliability)');
    const e = entityCard;
    if (e.workforce?.total)               lines.push(`Headcount: ${e.workforce.total}`);
    if (e.financials?.revenueAnnual)      lines.push(`Annual Revenue: ${e.financials.revenueAnnual}`);
    if (e.financials?.fundingTotal)       lines.push(`Total Funding (anchor): ${e.financials.fundingTotal}`);
    if (e.financials?.fundingLatestRound) lines.push(`Latest Round: ${e.financials.fundingLatestRound}`);
    if (e.headquarters?.city)            lines.push(`HQ: ${e.headquarters.city}${e.headquarters.country ? ', ' + e.headquarters.country : ''}`);
    if (e.foundedYear)                   lines.push(`Founded: ${e.foundedYear}`);
    lines.push('');
  }

  // Identity
  for (const [i, r] of (filtered?.identity?.results || []).entries()) {
    if (i === 0) lines.push('## Company Profile Sources');
    const summary = r.summary ? `Summary: ${r.summary}\n` : '';
    lines.push(`[Profile ${i + 1}] ${r.title}\n${r.url}\n${summary}${firstChars(r.text, 800)}\n`);
  }

  // Funding
  const fundingResults = filtered?.funding?.results || [];
  if (fundingResults.length > 0) {
    lines.push('## Funding & Investor Sources');
    lines.push('NOTE: Discard any figure that dramatically exceeds the entity card funding anchor above.\n');
    fundingResults.forEach((r, i) => {
      const body = r.highlights?.join(' ... ') || firstChars(r.text, 600);
      lines.push(`[Funding ${i + 1}] ${r.title}\n${r.url}\n${body}\n`);
    });
  }

  // Competitors
  for (const [i, r] of (filtered?.competitors?.results || []).entries()) {
    if (i === 0) lines.push('## Competitor Sources');
    lines.push(`[Competitor ${i + 1}] ${r.title}\n${r.url}\n${firstChars(r.text, 400)}\n`);
  }

  // Team
  for (const [i, r] of (filtered?.team?.results || []).entries()) {
    if (i === 0) lines.push('## Team & Leadership Sources');
    const wh       = r.entities?.[0]?.properties?.workHistory?.[0];
    const roleInfo = wh ? `Current role: ${wh.title || ''} at ${wh.company?.name || ''}\n` : '';
    lines.push(`[Team ${i + 1}] ${r.title}\n${r.url}\n${roleInfo}${firstChars(r.text, 500)}\n`);
  }

  // News
  for (const [i, r] of (filtered?.news?.results || []).entries()) {
    if (i === 0) lines.push('## News Sources (last 12 months)');
    const date = r.publishedDate ? ` [${r.publishedDate.slice(0, 10)}]` : '';
    const body = r.highlights?.join(' ... ') || firstChars(r.text, 400);
    lines.push(`[News ${i + 1}]${date} ${r.title}\n${r.url}\n${body}\n`);
  }

  // Ecosystem
  for (const [i, r] of (filtered?.ecosystem?.results || []).entries()) {
    if (i === 0) lines.push('## Ecosystem & Partnership Sources');
    const body = r.highlights?.join(' ... ') || firstChars(r.text, 400);
    lines.push(`[Ecosystem ${i + 1}] ${r.title}\n${r.url}\n${body}\n`);
  }

  // Ecosystem fallback
  for (const [i, r] of (ecosystem_fallback?.results || []).entries()) {
    if (i === 0) lines.push('## Ecosystem Fallback Sources');
    const body = r.highlights?.join(' ... ') || firstChars(r.text, 400);
    lines.push(`[EcoFallback ${i + 1}] ${r.title}\n${r.url}\n${body}\n`);
  }

  // Gap fill
  const gapFillGroups = gap_fill?.results || [];
  if (gapFillGroups.length > 0) {
    lines.push('## Gap Fill Sources (targeted — prefer over filtered sections for funding and team)');
    gapFillGroups.forEach((group) => {
      lines.push(`### Query: "${group.query}"`);
      (group.results || []).forEach((r, j) => {
        const body = r.highlights?.join(' ... ') || firstChars(r.text, 600);
        lines.push(`[Gap ${j + 1}] ${r.title}\n${r.url}\n${body}\n`);
      });
    });
  }

  // Research quality
  if (gap_detection?.confidence) {
    const c = gap_detection.confidence;
    lines.push('## Research Quality Signals');
    lines.push(`identity: ${c.identity} | funding: ${c.funding} | competitors: ${c.competitors} | news: ${c.news} | team: ${c.team} | ecosystem: ${c.ecosystem}`);
    if (gap_detection.notes) lines.push(`Note: ${gap_detection.notes}`);
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

async function synthesize(site, reSearched) {
  console.log(`[Synthesizer] Starting synthesis for: ${site}`);

  // Deterministic portfolio check — runs before Claude call
  const portfolioFindings = checkPortfolioOverlap(
    site,
    reSearched.filtered,
    reSearched.gap_fill,
    reSearched.ecosystem_fallback
  );

  const { target_in_portfolio, competitor_matches, ecosystem_matches } = portfolioFindings;
  console.log(`[Synthesizer] Portfolio — in_portfolio: ${!!target_in_portfolio} | competitor_hits: ${competitor_matches.length} | ecosystem_hits: ${ecosystem_matches.length}`);

  const researchContext = buildResearchContext(reSearched, portfolioFindings);

  const userMessage = `Synthesize the research below into an intelligence report for "${site}" by calling the synthesize_report tool.

${researchContext}

Instructions:
- Ground every field in the sources above — do not fabricate
- Use null, [], or "Undisclosed" for anything not found in sources
- Data priority: entity card > gap fill > filtered sections
- The Sagard portfolio cross-reference above is pre-computed — use it directly to write fit_score.portfolio_context
- news.summary and fit_score.rationale are the two most important fields — write them as a senior analyst would, specific to this company`;

  let response;

  try {
    response = await claude.messages.create({
      model:       'claude-sonnet-4-20250514',
      max_tokens:  4000,
      system:      [SYSTEM_PROMPT],
      tools:       [SYNTHESIZE_TOOL],
      tool_choice: { type: 'tool', name: 'synthesize_report' },
      messages:    [{ role: 'user', content: userMessage }],
    });
  } catch (err) {
    console.error('[Synthesizer] Claude API call failed:', err.message);
    return buildDefaultReport(site);
  }

  const toolBlock = response.content.find(b => b.type === 'tool_use');

  if (!toolBlock?.input) {
    console.error('[Synthesizer] No tool call returned — using default report');
    return buildDefaultReport(site);
  }

  const report = toolBlock.input;

  const u = response.usage;
  if (u) {
    console.log(`[Synthesizer] Tokens — input: ${u.input_tokens}, output: ${u.output_tokens}`);
    if (u.cache_read_input_tokens    > 0) console.log(`[Synthesizer] Cache hit    — saved ${u.cache_read_input_tokens} tokens`);
    if (u.cache_creation_input_tokens > 0) console.log(`[Synthesizer] Cache written — ${u.cache_creation_input_tokens} tokens`);
  }

  console.log(`[Synthesizer] Done — score: ${report.fit_score?.score} | confidence: ${report.confidence?.score}`);
  console.log(`[Synthesizer] Ecosystem nodes: ${report.ecosystem?.nodes?.length} | Competitors: ${report.competitive?.direct_competitors?.length}`);

  return report;
}

module.exports = { synthesize };