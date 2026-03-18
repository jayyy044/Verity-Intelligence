const Anthropic = require('@anthropic-ai/sdk');

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// System prompt — cached for 5 minutes by Anthropic
// Same every run so we only pay full price once per cache window
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = {
  type: 'text',
  text: `You are a research quality reviewer for a private company intelligence pipeline.

Your job is to review Exa search results and identify genuine gaps — fields that are missing or where results are clearly about the wrong company.

Gap detection rules:
- If funding.titles_mention_company === 0, the funding search returned wrong results — flag it
- If news.titles_mention_company === 0, the news search returned wrong results — flag it
- If founders.titles_mention_company === 0 and founders.count < 1, founder data is missing — flag it
- If company_profile.count === 0, no company data was found — flag it
- If competitors.count < 3, competitor data is thin — flag it
- If ecosystem.count === 0, no partnership or customer data found — flag it
- DO NOT flag gaps just because you want more detail on something already found
- Maximum 3 gap queries total — be conservative
- Write queries specific enough to find the right company — include the company name in every query

You must call the report_gaps tool with your findings. Always call it — never respond with prose.`,
  cache_control: { type: 'ephemeral' },
};

// ─────────────────────────────────────────────────────────────
// Tool definition — enforces exact output schema
// tool_choice forces Claude to always call this — no prose, no JSON parsing
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
      confidence: {
        type: 'object',
        properties: {
          company_profile: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          funding:         { type: 'string', enum: ['High', 'Medium', 'Low'] },
          competitors:     { type: 'string', enum: ['High', 'Medium', 'Low'] },
          news:            { type: 'string', enum: ['High', 'Medium', 'Low'] },
          founders:        { type: 'string', enum: ['High', 'Medium', 'Low'] },
          ecosystem:       { type: 'string', enum: ['High', 'Medium', 'Low'] },
        },
        required: ['company_profile', 'funding', 'competitors', 'news', 'founders', 'ecosystem'],
      },
      notes: {
        type: 'string',
        description: 'One sentence summary of overall data quality',
      },
    },
    required: ['gaps', 'confidence', 'notes'],
  },
};

// ─────────────────────────────────────────────────────────────
// Default fallback — returned if tool call fails for any reason
// ─────────────────────────────────────────────────────────────

const DEFAULT_RESULT = {
  gaps: [],
  confidence: {
    company_profile: 'Medium',
    funding: 'Medium',
    competitors: 'Medium',
    news: 'Medium',
    founders: 'Medium',
    ecosystem: 'Medium',
  },
  notes: 'Gap detection failed — proceeding with available data',
};

async function detectGaps(company, commercialData, signalsData) {
  console.log(`[Gap Detector] Reviewing results for: ${company}`);

  // Build lightweight summary — titles only, no full text
  // Keeps tokens low since this is a Haiku call
  const summary = {
    company_profile: {
      count: commercialData.companyProfile.results.length,
      titles: commercialData.companyProfile.results.map(r => r.title),
    },
    competitors: {
      count: commercialData.competitors.results.length,
      titles: commercialData.competitors.results.map(r => r.title),
    },
    funding: {
      count: commercialData.funding.results.length,
      titles: commercialData.funding.results.map(r => r.title),
      titles_mention_company: commercialData.funding.results
        .filter(r => r.title?.toLowerCase().includes(company.toLowerCase()))
        .length,
    },
    ecosystem: {
      count: commercialData.ecosystem?.results.length || 0,
      titles: (commercialData.ecosystem?.results || []).map(r => r.title),
    },
    news: {
      count: signalsData.news.results.length,
      titles: signalsData.news.results.map(r => r.title),
      titles_mention_company: signalsData.news.results
        .filter(r => r.title?.toLowerCase().includes(company.toLowerCase()))
        .length,
    },
    founders: {
      count: signalsData.founders.results.length,
      titles: signalsData.founders.results.map(r => r.title),
      titles_mention_company: signalsData.founders.results
        .filter(r =>
          r.title?.toLowerCase().includes(company.toLowerCase()) ||
          r.text?.slice(0, 500).toLowerCase().includes(company.toLowerCase())
        )
        .length,
    },
  };

  let response;

  try {
    response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: [SYSTEM_PROMPT],
      tools: [GAP_TOOL],
      tool_choice: { type: 'tool', name: 'report_gaps' },
      messages: [{
        role: 'user',
        content: `Company: "${company}"\n\nSearch results summary:\n${JSON.stringify(summary, null, 2)}`,
      }],
    });
  } catch (err) {
    console.error('[Gap Detector] Claude call failed:', err.message);
    return DEFAULT_RESULT;
  }

  // Extract tool use block
  const toolBlock = response.content.find(b => b.type === 'tool_use');

  if (!toolBlock) {
    console.log('[Gap Detector] No tool call returned — using defaults');
    return DEFAULT_RESULT;
  }

  const result = toolBlock.input;

  // Log results
  console.log(`[Gap Detector] Gaps found: ${result.gaps.length}`);
  result.gaps.forEach((g, i) => console.log(`  Gap ${i + 1}: ${g}`));
  console.log(`[Gap Detector] Notes: ${result.notes}`);

  // Log cache performance if available
  if (response.usage?.cache_read_input_tokens > 0) {
    console.log(`[Gap Detector] Cache hit — saved ${response.usage.cache_read_input_tokens} input tokens`);
  } else if (response.usage?.cache_creation_input_tokens > 0) {
    console.log(`[Gap Detector] Cache created — ${response.usage.cache_creation_input_tokens} tokens written to cache`);
  }

  return result;
}

module.exports = { detectGaps };