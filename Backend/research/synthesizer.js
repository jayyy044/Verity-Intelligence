const Anthropic = require('@anthropic-ai/sdk');

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — cached (ephemeral)
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = {
    type: 'text',
    text: `You are a private company intelligence analyst for Sagard, a multi-strategy alternative asset manager focused on FinTech, Healthcare, and Technology.
  
  Your job is to read raw web research results and synthesize them into a structured intelligence report by calling the synthesize_report tool. Every field must be grounded in the provided sources.
  
  ## Sagard Investment Thesis — use this to score thesis fit
  - **Target sectors:** FinTech / Financial Services, Healthcare, Technology — but Sagard reviews companies across all sectors
  - **Strategies:** VC (early/growth-stage), PE (profitable small/mid-market buyouts), Credit (direct lending, asset-backed, cash-flowing)
  - **Geography:** North American focus
  - **Stage signals:** VC = pre-revenue to ~$50M ARR | PE = profitable, small/mid-market scale (sub-$500M valuation typical) | Credit = asset-backed or cash-flowing
  
  ## Field-by-field instructions
  
  ### company
  - description: one sentence max — what the company does, for whom, how it makes money
  - business_model: describe how the company makes money in 2–4 words. Examples: "B2B SaaS", "B2C subscription", "B2B2C platform", "Transaction fees", "Usage-based SaaS", "D2C e-commerce", "Professional services", "Marketplace". Use whatever label best fits — don't force it into a preset category.
  - sector: the primary industry the company operates in. Examples: "FinTech", "Healthcare", "Technology", "Real Estate", "Energy", "Consumer", "Logistics", "EdTech", "CleanTech", "Media", "Manufacturing". Use the most accurate label for what the company does.
  - vertical: the specific sub-sector or niche. Examples: "Wealth Management", "Digital Health", "Payments Infrastructure", "Supply Chain", "HR Tech", "Cybersecurity", "Insurtech", "Legal Tech", "AgriTech". Be specific.
  
  ### funding
  - total_raised: sum all rounds if multiple are mentioned, format as "$XM" or "$XB" — "Undisclosed" if nothing found
  - last_round.series: the most recent round label as it appears in the sources. Examples: "Seed", "Series A", "Series C", "Growth Equity", "Venture Round", "Debt Financing". Use the exact label from the source.
  - key_investors: top 3–4 names only — pick the most recognizable
  - ownership_type: describe the ownership structure based on what is in the sources. Examples: "Founder-led", "VC-backed", "PE-backed", "PE-backed (founder retained)", "Family-owned", "Publicly traded", "Subsidiary". Use whatever fits.
  
  ### competitive
  - market_position: describe the company's competitive standing based on signals in the sources — market share, AUM, user count, revenue rank, stated positioning. Examples: "Market leader in Canada", "Challenger to incumbent banks", "Early-stage, niche focus", "Dominant in SMB segment", "Fast follower in enterprise". Be specific to what the sources say.
  - direct_competitors: 3–5 companies. differentiator = one line describing how THEY differ FROM the target company — not what they do generally
  
  ### team
  - ceo_name + ceo_background: 1–2 sentences — prior roles, education, notable achievements
  - founder_names: all named co-founders found in the sources
  
  ### news
  - sentiment: overall tone across all news items — must be exactly one of: Positive | Neutral | Negative
  - summary: 2–3 sentence analyst-style narrative. Synthesize the tone and themes: what momentum signals exist, any risks or headwinds mentioned, what it signals about the company's trajectory. This is the paragraph shown in the News & Sentiment panel.
  - recent_events: up to 4 strings, each one specific event from the last 12 months. Format: what happened + brief significance. Include date context if available.
  
  ### fit_score
  - score: must be exactly one of: Strong | Moderate | Weak
  - sector_match: which of Sagard's core sectors this maps to. If it fits one of their target sectors write that (e.g. "FinTech", "Healthcare", "Technology"). If it is adjacent write the actual sector (e.g. "Real Estate", "Consumer", "Logistics"). If there is no meaningful fit write "None".
  - strategy_match: which Sagard strategy fits best — VC | PE | Credit | None. Use the stage signals above to decide. Critical rules:
    - PE match requires the company to be a realistic buyout candidate — profitable AND small/mid-market scale (sub-$500M valuation typical). A company with a $1B+ valuation is NOT a PE target regardless of profitability — use "VC" for late-stage growth companies still scaling.
    - VC match = early or growth-stage companies, typically pre-IPO, scaling revenue, may or may not be profitable yet.
    - Credit match = companies with predictable cash flows or hard assets suitable for direct lending.
    - When in doubt between VC and PE, ask: could Sagard realistically acquire a controlling stake? If the valuation makes that implausible, it's VC.
  - geography: primary market label derived from the sources. Examples: "Canada", "USA", "North America", "UK", "Europe", "Global", "LATAM"
  - rationale: 2–3 sentences, analyst tone, specific — connect sector alignment, stage/strategy fit, and standout signals. The most important field. Be specific, not generic.
  
  ### ecosystem.nodes — must include ALL of these:
  - One node type "target" — the company itself
  - One node per direct competitor, type "competitor"
  - 2–4 nodes type "ecosystem" — key partners, investors, distribution channels, or adjacent players named in the sources
  - One node type "sagard", name "Sagard"
    - If Sagard is named as an investor in any funding source, set relationship to "Prior investor" and note the round if available (e.g. "Prior investor — 2021 round")
    - If Sagard is NOT named as an investor in any source, set relationship to "Potential investor"
  
  ### confidence
  - must be exactly one of: High | Medium | Low
  - High = most fields sourced from primary sources (press releases, company site, named publications)
  - Medium = mix of primary and secondary sources, some inference required
  - Low = sparse data, significant inference required
  - confidence_note: one sentence on what was strong and what was weak
  
  ### market (Tier 2)
  - tam_estimate: if a market size figure is mentioned in the sources, use it formatted as "$XB" or "$XM". null if not found — do not estimate.
  - tailwinds: 2–3 short phrases describing macro or sector trends working IN FAVOUR of the company. You may infer from industry context if not explicitly stated. [] if nothing reasonable.
  - headwinds: 2–3 short phrases describing risks or trends working AGAINST the company. [] if nothing reasonable.
  
  ### Other Tier 2 fields
  - headcount: string like "1,200+" or "~500" or "50–100" if mentioned in sources, null if not
  - revenue_stage: scan ALL sources carefully for any profitability or revenue signal — words like "profitable", "cash-flowing", "revenue growth", "ARR", "recurring revenue" anywhere in the text count. Use the most informative label found. Examples: "Pre-revenue", "<$1M ARR", "$1–10M ARR", "$10–50M ARR", "$50M+ ARR", "Profitable", "Undisclosed". null only if there is genuinely zero signal anywhere in the sources.
  - moat_signals: short strings describing defensibility signals found in or inferable from the sources. Examples: "Network effects from 3M+ user base", "Proprietary data advantage", "High switching costs for enterprise clients", "Regulatory moat via banking licence". [] if none.
  - leadership_changes: true only if a named leadership change is mentioned in the last 12 months. false otherwise.
  - key_partnerships: named partners from the sources as short strings. Examples: "Broadridge (distribution)", "Power Corporation (strategic investor)", "Visa (network partner)". [] if none found.
  
  ## Hard rules
  - Never fabricate funding amounts, investor names, or competitor names
  - Never leave a required field blank — use the specified fallback
  - Never score "Strong" thesis fit unless sector AND strategy both clearly align with Sagard's thesis
  - For the three UI display fields (sentiment, score, confidence) — use only the exact values specified. Everything else is open.`,
    cache_control: { type: 'ephemeral' },
};

// ─────────────────────────────────────────────────────────────
// TOOL DEFINITION
// ─────────────────────────────────────────────────────────────

const SYNTHESIZE_TOOL = {
  name: 'synthesize_report',
  description: 'Output a structured intelligence report for a private company',
  input_schema: {
    type: 'object',
    required: [
      'company', 'funding', 'competitive', 'team', 'news',
      'fit_score', 'ecosystem', 'confidence', 'confidence_note',
      'headcount', 'revenue_stage', 'market',
      'moat_signals', 'leadership_changes', 'key_partnerships',
    ],
    properties: {

      // ── TIER 1 ──────────────────────────────────────────────

      company: {
        type: 'object',
        required: ['name', 'website', 'hq', 'founded', 'description', 'business_model', 'sector', 'vertical'],
        properties: {
          name:           { type: 'string' },
          website:        { type: 'string' },
          hq:             { type: 'string' },
          founded:        { type: 'string' },
          description:    { type: 'string', description: 'One sentence max' },
          business_model: { type: 'string', description: 'How the company makes money — e.g. "B2B SaaS", "B2C subscription", "Transaction fees", "Marketplace". Use the most accurate label.' },
          sector:         { type: 'string', description: 'Primary industry — e.g. "FinTech", "Healthcare", "Technology", "Logistics", "Consumer", "CleanTech". Use the most accurate label.' },
          vertical:       { type: 'string' },
        },
      },

      funding: {
        type: 'object',
        required: ['total_raised', 'last_round', 'key_investors', 'ownership_type'],
        properties: {
          total_raised: { type: 'string' },
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
          ownership_type: { type: 'string', description: 'Ownership structure — e.g. "Founder-led", "VC-backed", "PE-backed", "Family-owned", "Publicly traded", "Subsidiary".' },
        },
      },

      competitive: {
        type: 'object',
        required: ['market_position', 'direct_competitors'],
        properties: {
          market_position: { type: 'string', description: 'Competitive standing based on source signals — e.g. "Market leader in Canada", "Challenger to incumbent banks", "Early-stage niche player", "Dominant in SMB segment".' },
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

      team: {
        type: 'object',
        required: ['ceo_name', 'ceo_background', 'founder_names'],
        properties: {
          ceo_name:       { type: 'string' },
          ceo_background: { type: 'string' },
          founder_names:  { type: 'array', items: { type: 'string' } },
        },
      },

      news: {
        type: 'object',
        required: ['sentiment', 'summary', 'recent_events'],
        properties: {
          sentiment: {
            type: 'string',
            enum: ['Positive', 'Neutral', 'Negative'],
          },
          summary: {
            type: 'string',
            description: '2–3 sentence analyst narrative synthesizing tone, momentum, and trajectory across all news items',
          },
          recent_events: {
            type: 'array',
            maxItems: 4,
            items: { type: 'string' },
            description: 'Up to 4 specific events from last 12 months — one sentence each: what happened + significance',
          },
        },
      },

      fit_score: {
        type: 'object',
        required: ['score', 'sector_match', 'strategy_match', 'geography', 'rationale'],
        properties: {
          score:          { type: 'string', enum: ['Strong', 'Moderate', 'Weak'] },
          sector_match:   { type: 'string', description: 'Sagard sector match — use "FinTech", "Healthcare", or "Technology" if it fits. Otherwise write the actual sector (e.g. "Real Estate", "Consumer"). Write "None" if no fit.' },
          strategy_match: { type: 'string', enum: ['VC', 'PE', 'Credit', 'None'] },
          geography:      { type: 'string' },
          rationale:      { type: 'string' },
        },
      },

      ecosystem: {
        type: 'object',
        required: ['nodes'],
        properties: {
          nodes: {
            type: 'array',
            minItems: 3,
            items: {
              type: 'object',
              required: ['name', 'type', 'relationship'],
              properties: {
                name:         { type: 'string' },
                type:         { type: 'string', enum: ['target', 'competitor', 'ecosystem', 'sagard'] },
                relationship: { type: 'string' },
              },
            },
          },
        },
      },

      confidence:      { type: 'string', enum: ['High', 'Medium', 'Low'] },
      confidence_note: { type: 'string' },

      // ── TIER 2 ──────────────────────────────────────────────

      headcount:     { type: ['string', 'null'] },
      revenue_stage: {
        type: ['string', 'null'],
        description: 'Revenue scale label if signal found — e.g. "Pre-revenue", "<$1M ARR", "$1–10M ARR", "$10–50M ARR", "$50M+ ARR", "Profitable", "Undisclosed". null if no signal.',
      },

      market: {
        type: 'object',
        required: ['tam_estimate', 'tailwinds', 'headwinds'],
        properties: {
          tam_estimate: { type: ['string', 'null'] },
          tailwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
          headwinds:    { type: 'array', items: { type: 'string' }, maxItems: 3 },
        },
      },

      moat_signals:       { type: 'array', items: { type: 'string' } },
      leadership_changes: { type: 'boolean' },
      key_partnerships:   { type: 'array', items: { type: 'string' } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// DEFAULT FALLBACK
// ─────────────────────────────────────────────────────────────

function buildDefaultReport(company) {
  return {
    company: {
      name: company,
      website: 'Insufficient data',
      hq: 'Insufficient data',
      founded: 'Insufficient data',
      description: 'Insufficient data',
      business_model: 'Other',
      sector: 'Other',
      vertical: 'Insufficient data',
    },
    funding: {
      total_raised: 'Undisclosed',
      last_round: { series: 'Insufficient data', amount: 'Insufficient data', date: 'Insufficient data' },
      key_investors: [],
      ownership_type: 'Unknown',
    },
    competitive: { market_position: 'Niche', direct_competitors: [] },
    team: { ceo_name: 'Insufficient data', ceo_background: 'Insufficient data', founder_names: [] },
    news: {
      sentiment: 'Neutral',
      summary: 'Insufficient data to assess news signals.',
      recent_events: [],
    },
    fit_score: {
      score: 'Weak',
      sector_match: 'None',
      strategy_match: 'None',
      geography: 'Unknown',
      rationale: 'Synthesis failed — insufficient data to assess thesis fit.',
    },
    ecosystem: {
      nodes: [
        { name: company, type: 'target', relationship: 'Target company under evaluation' },
        { name: 'Sagard', type: 'sagard', relationship: 'Potential investor' },
      ],
    },
    confidence: 'Low',
    confidence_note: 'Synthesis failed — raw data returned.',
    headcount: null,
    revenue_stage: null,
    market: { tam_estimate: null, tailwinds: [], headwinds: [] },
    moat_signals: [],
    leadership_changes: false,
    key_partnerships: [],
  };
}

// ─────────────────────────────────────────────────────────────
// CONTEXT BUILDER
// Funding gets 600-char previews (highest hallucination risk).
// News sources use highlights when available — more signal-dense.
// ─────────────────────────────────────────────────────────────

function buildResearchContext(company, pipelineOutput) {
  const { results } = pipelineOutput;
  const lines = [];

  lines.push(`## Company Under Analysis: "${company}"\n`);

  if (results.callA.companyProfile.results.length > 0) {
    lines.push('## Company Profile Sources');
    results.callA.companyProfile.results.forEach((r, i) => {
      lines.push(`[Profile ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
    });
  }

  if (results.callA.funding.results.length > 0) {
    lines.push('## Funding & Investor Sources');
    results.callA.funding.results.forEach((r, i) => {
      lines.push(`[Funding ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
    });
  }

  if (results.callA.competitors.results.length > 0) {
    lines.push('## Competitor Sources');
    results.callA.competitors.results.forEach((r, i) => {
      lines.push(`[Competitor ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
    });
  }

  if (results.callA.ecosystem.results.length > 0) {
    lines.push('## Ecosystem & Partnership Sources');
    results.callA.ecosystem.results.forEach((r, i) => {
      lines.push(`[Ecosystem ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
    });
  }

  if (results.callB.news.results.length > 0) {
    lines.push('## News Sources (last 12 months)');
    results.callB.news.results.forEach((r, i) => {
      const date = r.published ? ` [${r.published}]` : '';
      // Highlights are more signal-dense than plain previews — prefer them
      const body = r.highlights?.join(' ... ') || r.preview || '';
      lines.push(`[News ${i + 1}]${date} ${r.title}\n${r.url}\n${body}\n`);
    });
  }

  if (results.callB.founders.results.length > 0) {
    lines.push('## Team & Leadership Sources');
    results.callB.founders.results.forEach((r, i) => {
      lines.push(`[Team ${i + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
    });
  }

  if (results.gapFill?.results?.length > 0) {
    lines.push('## Supplemental Research (Gap Fill)');
    results.gapFill.results.forEach((gap, i) => {
      lines.push(`### Gap query: "${gap.query}"`);
      gap.results.forEach((r, j) => {
        lines.push(`[Gap ${i + 1}.${j + 1}] ${r.title}\n${r.url}\n${r.preview || ''}\n`);
      });
    });
  }

  if (pipelineOutput.gap_detection?.confidence) {
    const c = pipelineOutput.gap_detection.confidence;
    lines.push('## Research Quality Signals');
    lines.push(
      `company_profile: ${c.company_profile} | funding: ${c.funding} | competitors: ${c.competitors} | news: ${c.news} | founders: ${c.founders} | ecosystem: ${c.ecosystem}`
    );
    if (pipelineOutput.gap_detection.notes) {
      lines.push(`Note: ${pipelineOutput.gap_detection.notes}`);
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

async function synthesize(company, pipelineOutput) {
  console.log(`[Synthesizer] Starting synthesis for: ${company}`);

  const researchContext = buildResearchContext(company, pipelineOutput);

  const userMessage = `Synthesize the research below into an intelligence report for "${company}" by calling the synthesize_report tool.

${researchContext}

Instructions:
- Ground every field in the sources above — no fabrication
- Use fallback values (null, [], "Undisclosed", "Insufficient data") for anything not found
- news.summary and fit_score.rationale are the two most important fields — write them as a senior analyst would
- For tailwinds/headwinds: 2–3 short phrases each. You may infer from industry context if not explicitly stated.`;

  let response;

  try {
    response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: [SYSTEM_PROMPT],
      tools: [SYNTHESIZE_TOOL],
      tool_choice: { type: 'tool', name: 'synthesize_report' },
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (err) {
    console.error('[Synthesizer] Claude API call failed:', err.message);
    return buildDefaultReport(company);
  }

  const toolBlock = response.content.find(b => b.type === 'tool_use');

  if (!toolBlock?.input) {
    console.error('[Synthesizer] No tool call returned — using default report');
    return buildDefaultReport(company);
  }

  const report = toolBlock.input;

  // Always ensure Sagard node exists
  const hasSagard = report.ecosystem?.nodes?.some(n => n.type === 'sagard');
  if (!hasSagard) {
    report.ecosystem.nodes.push({
      name: 'Sagard',
      type: 'sagard',
      relationship: 'Potential investor',
    });
  }

  const u = response.usage;
  if (u) {
    console.log(`[Synthesizer] Tokens — input: ${u.input_tokens}, output: ${u.output_tokens}`);
    if (u.cache_read_input_tokens > 0) {
      console.log(`[Synthesizer] Cache hit — saved ${u.cache_read_input_tokens} tokens`);
    } else if (u.cache_creation_input_tokens > 0) {
      console.log(`[Synthesizer] Cache written — ${u.cache_creation_input_tokens} tokens`);
    }
  }

  console.log(`[Synthesizer] Done — score: ${report.fit_score?.score}, confidence: ${report.confidence}`);
  console.log(`[Synthesizer] Nodes: ${report.ecosystem?.nodes?.length} | Competitors: ${report.competitive?.direct_competitors?.length}`);

  return report;
}

module.exports = { synthesize };