const Anthropic = require('@anthropic-ai/sdk');

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — cached for 5 minutes by Anthropic
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = {
  type: 'text',
  text: `You are a research quality reviewer for a private company intelligence pipeline.

You receive a summary of ALREADY FILTERED search results for a target company. Noise and contamination have been removed before you see this data. Your job is to identify genuine data gaps and generate targeted gap-fill search queries.

## What you receive
- filtered_counts: how many clean results remain per section after noise removal
- section_titles: titles of surviving results so you can assess relevance
- entity_card: structured data from the company identity card (employees, revenue, funding)
- team_roles: current roles found in LinkedIn profiles
- has_founder_or_ceo: boolean — true only if a profile with a founder/CEO title and a real start date survived filtering
- ecosystem_empty_needs_fallback: whether ecosystem returned 0 results and needs a retry with company name instead of domain
- company_name: display name (e.g. "Stripe")
- domain: canonical website (e.g. "stripe.com")
- descriptor: market context (e.g. "payment processing fintech")

## Confidence scoring rules — read carefully

Score based on CONTENT QUALITY, not just counts. Titles are your signal.

**identity**: High if 2+ results clearly about the right company | Medium if 1 result | Low if 0
**funding**: High if 2+ results with company name in title | Medium if 1 | Low if 0
**competitors**: 
  - High: 3+ results that are actual competing companies in the same market as descriptor
  - LOW REGARDLESS OF COUNT if titles contain: sports leagues, dating apps, sports management software, gaming, entertainment, or any category clearly unrelated to the descriptor
  - When in doubt, check if titles match the descriptor market — "health benefits platform" competitors should be health tech companies, not sports software
**news**: High if 3+ results with company name in title | Medium if 1-2 | Low if 0
  - LOW if titles are clearly about different entities sharing the same word (e.g. "Little League", "Snow League", "Premier League" when company is a health tech firm named League)
**team**: 
  - High ONLY if has_founder_or_ceo === true AND filtered_counts.team >= 2
  - Medium if has_founder_or_ceo === false but 2+ profiles exist
  - Low if filtered_counts.team === 0
**ecosystem**: always Low if count === 0 | Medium if fallback returns results | High if 3+ direct partnership results

## Gap detection rules

**funding gap** — flag if filtered_counts.funding === 0. Generate a targeted query for this company's funding history including the domain.

**news gap** — flag if filtered_counts.news === 0. Do NOT flag if count >= 2.

**team/founder gap** — flag if filtered_counts.team === 0 OR has_founder_or_ceo === false. Generate a query targeting the founder by name if known, or "founder CEO" + company name + domain.

**ecosystem gap** — flag if ecosystem_empty_needs_fallback === true. The ecosystem_fallback_query field handles this — set it and do NOT also add it to gaps[] unless it's a truly different query.

**competitors gap** — flag ONLY if filtered_counts.competitors < 3 OR if section_titles.competitors clearly shows results from the wrong market category. If flagging due to wrong category, note this in your query — ask for competitors specifically in the descriptor market.

**identity gap** — flag ONLY if filtered_counts.identity === 0.

## What NOT to flag
- Do NOT flag funding if count >= 1
- Do NOT flag news if count >= 2
- Do NOT flag ecosystem in gaps[] if ecosystem_empty_needs_fallback === true — use ecosystem_fallback_query for that
- Do NOT flag team if has_founder_or_ceo === true
- Do NOT add gap queries for things already found
- Do NOT flag anything for seed-stage companies with < 50 employees — limited press is expected

## Query writing rules — CRITICAL
- This is Exa, not Google. NEVER use site: operator. It is not supported and will be ignored.
- Every gap query MUST include the company domain as a plain word (e.g. "stripe.com"), not as a site: filter
- Every gap query MUST be specific
- Correct: "League health benefits platform partnerships customers league.com"
- Wrong: "League partnerships site:league.com"
- Ecosystem fallback format: "[company name] partnership integration customer deal [domain]"
- Founder format: "[founder name if known] [company] founder CEO [domain]"
- Competitors gap format: "[company] competitors alternatives [descriptor market] [domain]"
- Maximum 3 gap queries in gaps[] total — be ruthlessly conservative
- If ecosystem_fallback_query would be identical or near-identical to a query already in gaps[], set ecosystem_fallback_query to empty string instead — the gap fill will cover it

You must call the report_gaps tool. Never respond with prose.`,
  cache_control: { type: 'ephemeral' },
};

// ─────────────────────────────────────────────────────────────
// TOOL DEFINITION
// ─────────────────────────────────────────────────────────────

const GAP_TOOL = {
  name: 'report_gaps',
  description: 'Report identified research gaps and confidence levels for each data dimension',
  input_schema: {
    type: 'object',
    properties: {
      gaps: {
        type: 'array',
        items: { type: 'string' },
        description: 'Targeted Exa search queries for missing fields. Empty array if no gaps.',
        maxItems: 3,
      },
      ecosystem_fallback_query: {
        type: 'string',
        description: 'If ecosystem needs name-based retry, the exact Exa query to run. Empty string if not needed or if already covered by a gap query.',
      },
      confidence: {
        type: 'object',
        properties: {
          identity:    { type: 'string', enum: ['High', 'Medium', 'Low'] },
          funding:     { type: 'string', enum: ['High', 'Medium', 'Low'] },
          competitors: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          news:        { type: 'string', enum: ['High', 'Medium', 'Low'] },
          team:        { type: 'string', enum: ['High', 'Medium', 'Low'] },
          ecosystem:   { type: 'string', enum: ['High', 'Medium', 'Low'] },
        },
        required: ['identity', 'funding', 'competitors', 'news', 'team', 'ecosystem'],
      },
      notes: {
        type: 'string',
        description: 'One sentence summary of overall data quality and any key issues.',
      },
    },
    required: ['gaps', 'ecosystem_fallback_query', 'confidence', 'notes'],
  },
};

// ─────────────────────────────────────────────────────────────
// DEFAULT FALLBACK
// ─────────────────────────────────────────────────────────────

const DEFAULT_RESULT = {
  gaps: [],
  ecosystem_fallback_query: '',
  confidence: {
    identity:    'Medium',
    funding:     'Medium',
    competitors: 'Medium',
    news:        'Medium',
    team:        'Medium',
    ecosystem:   'Low',
  },
  notes: 'Gap detection failed — proceeding with available data',
};

// ─────────────────────────────────────────────────────────────
// BUILD SUMMARY — lightweight payload for Claude
// Only sends titles + counts + key metadata — no full text
// ─────────────────────────────────────────────────────────────

function buildSummary(filteredData, meta) {
  const { company, domain, descriptor } = meta;

  const teamRoles = filteredData.team.results.map(r => {
    const entity = r.entities?.[0]?.properties;
    const wh = entity?.workHistory?.[0];
    return {
      title: r.title,
      role: wh?.title || '',
      company: wh?.company?.name || '',
      hasDate: !!(wh?.dates?.from),
    };
  });

  const founderRoles = ['founder', 'ceo', 'co-founder', 'cofounder', 'president'];
  const hasFounderOrCEO = teamRoles.some(t =>
    founderRoles.some(f => t.role.toLowerCase().includes(f)) && t.hasDate
  );

  const identityResult = filteredData.identity.results[0];
  const entityCard = identityResult?.entities?.[0]?.properties || null;
  const entityCardSummary = entityCard ? {
    employees:    entityCard.workforce?.total || null,
    revenue:      entityCard.financials?.revenueAnnual || null,
    fundingTotal: entityCard.financials?.fundingTotal || null,
    lastRound:    entityCard.financials?.fundingLatestRound || null,
    hq:           entityCard.headquarters?.city || null,
  } : null;

  return {
    company_name: company,
    domain,
    descriptor,
    filtered_counts: {
      identity:    filteredData.identity.count,
      funding:     filteredData.funding.count,
      competitors: filteredData.competitors.count,
      team:        filteredData.team.count,
      news:        filteredData.news.count,
      ecosystem:   filteredData.ecosystem.count,
    },
    entity_card: entityCardSummary,
    section_titles: {
      identity:    filteredData.identity.results.map(r => r.title),
      funding:     filteredData.funding.results.map(r => r.title),
      competitors: filteredData.competitors.results.map(r => r.title),
      news:        filteredData.news.results.map(r => r.title),
      ecosystem:   filteredData.ecosystem.results.map(r => r.title),
    },
    team_roles: teamRoles,
    has_founder_or_ceo: hasFounderOrCEO,
    ecosystem_empty_needs_fallback: filteredData._meta?.ecosystemNeedsNameFallback || false,
    filter_stats: {
      total_removed: filteredData._meta?.totalRemoved || 0,
      anchors_used:  filteredData._meta?.anchorsUsed || [],
    },
  };
}

// ─────────────────────────────────────────────────────────────
// DETECT GAPS — main export
// ─────────────────────────────────────────────────────────────

async function detectGaps(filteredData, meta) {
  const { company, domain } = meta;
  console.log(`[Gap Detector] Reviewing filtered results for: ${company} (${domain})`);

  const summary = buildSummary(filteredData, meta);

  console.log(`[Gap Detector] Filtered counts:`, summary.filtered_counts);
  console.log(`[Gap Detector] Has founder/CEO in team: ${summary.has_founder_or_ceo}`);
  console.log(`[Gap Detector] Ecosystem needs fallback: ${summary.ecosystem_empty_needs_fallback}`);

  let response;

  try {
    response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: [SYSTEM_PROMPT],
      tools: [GAP_TOOL],
      tool_choice: { type: 'tool', name: 'report_gaps' },
      messages: [{
        role: 'user',
        content: `Company: "${company}" | Domain: "${domain}" | Descriptor: "${meta.descriptor || ''}"\n\nFiltered results summary:\n${JSON.stringify(summary, null, 2)}`,
      }],
    });
  } catch (err) {
    console.error('[Gap Detector] Claude call failed:', err.message);
    return DEFAULT_RESULT;
  }

  const toolBlock = response.content.find(b => b.type === 'tool_use');

  if (!toolBlock) {
    console.log('[Gap Detector] No tool call returned — using defaults');
    return DEFAULT_RESULT;
  }

  const result = toolBlock.input;

  console.log(`[Gap Detector] Gaps found: ${result.gaps.length}`);
  result.gaps.forEach((g, i) => console.log(`  Gap ${i + 1}: ${g}`));
  if (result.ecosystem_fallback_query) {
    console.log(`[Gap Detector] Ecosystem fallback: ${result.ecosystem_fallback_query}`);
  }
  console.log(`[Gap Detector] Confidence:`, result.confidence);
  console.log(`[Gap Detector] Notes: ${result.notes}`);

  if (response.usage?.cache_read_input_tokens > 0) {
    console.log(`[Gap Detector] Cache hit — saved ${response.usage.cache_read_input_tokens} tokens`);
  } else if (response.usage?.cache_creation_input_tokens > 0) {
    console.log(`[Gap Detector] Cache created — ${response.usage.cache_creation_input_tokens} tokens written`);
  }

  return result;
}


// ─────────────────────────────────────────────────────────────
// filterGapFill — lightweight anchor filter for gap fill results
//
// Gap fill searches bypass the main filterNoise pipeline so we
// run a minimal relevance check here: at least one anchor must
// appear in the title OR the first 500 chars of text OR highlights.
// No section-specific logic — just confirm the result is about
// the right company before it reaches the synthesizer.
//
// Add this function to filterNoise.js, then update the module.exports:
//   module.exports = { filterNoise, filterGapFill };
// ─────────────────────────────────────────────────────────────


module.exports = { detectGaps };