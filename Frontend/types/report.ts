// // src/types/report.ts
// // Single source of truth for the IntelligenceReport shape.
// // Import into: BriefPanel, CompanyProfile, FitScore,
// // MarketSection, NewsSection, EcosystemMap, results page.

// export interface EcosystemNode {
//   name: string;
//   type: "target" | "competitor" | "ecosystem" | "sagard";
//   relationship: string;
// }

// export interface IntelligenceReport {
//   // ── Tier 1 ──────────────────────────────────────────────────
//   company: {
//     name: string;
//     website: string;
//     hq: string;             // "Toronto, Canada"
//     founded: string;        // "September 2014" or "2014"
//     description: string;
//     business_model: string; // "B2C FinTech platform"
//     sector: string;         // "FinTech"
//     vertical: string;       // "Wealth Management"
//   };
//   funding: {
//     total_raised: string;
//     last_round: { series: string; amount: string; date: string };
//     key_investors: string[];
//     ownership_type: string;
//   };
//   competitive: {
//     market_position: string;
//     direct_competitors: { name: string; differentiator: string }[];
//   };
//   team: {
//     ceo_name: string;
//     ceo_background: string;
//     founder_names: string[];
//   };
//   news: {
//     sentiment: "Positive" | "Neutral" | "Negative";
//     summary: string;
//     recent_events: string[];
//   };
//   fit_score: {
//     score: "Strong" | "Moderate" | "Weak";
//     sector_match: string;
//     strategy_match: string;
//     geography: string;
//     rationale: string;
//   };
//   ecosystem: { nodes: EcosystemNode[] };
//   confidence: "High" | "Medium" | "Low";
//   confidence_note: string;

//   // ── Tier 2 ──────────────────────────────────────────────────
//   headcount: string | null;
//   revenue_stage: string | null;
//   market: {
//     tam_estimate: string | null;
//     tailwinds: string[];
//     headwinds: string[];
//   };
//   moat_signals: string[];
//   leadership_changes: boolean;
//   key_partnerships: string[];
// }


// src/types/report.ts
// Single source of truth for the IntelligenceReport shape.
// Import into: BriefPanel, CompanyProfile, FitScore,
// MarketSection, NewsSection, EcosystemMap, results page.

export interface EcosystemNode {
  name: string;
  type: "competitor" | "ecosystem";
  relationship: string;
}

export interface RecentEvent {
  date: string;   // "March 2026" | "Q1 2025" etc.
  event: string;  // what happened + brief significance
}

export interface IntelligenceReport {

  identity: {
    name: string;
    website: string;
    hq: string;             // "Toronto, Canada"
    founded: string;        // "2014"
    description: string;    // one sentence
    business_model: string; // "B2B SaaS" | "Transaction fees" etc.
    sector: string;         // "FinTech" | "Healthcare" | "Technology"
    vertical: string;       // "Wealth Management" | "Prior Authorization AI" etc.
    headcount: string | null;
    revenue_stage:
      | "Pre-revenue"
      | "<$1M ARR"
      | "$1–10M ARR"
      | "$10–50M ARR"
      | "$50M+ ARR"
      | "Profitable"
      | "Undisclosed"
      | null;
  };

  funding: {
    total_raised: string;   // "$200M" | "Undisclosed"
    last_round: {
      series: string;       // "Series C" | "Growth Equity" | "Seed"
      amount: string;       // "$40M"
      date: string;         // "October 2025"
    };
    key_investors: string[];
    ownership_type: string; // "VC-backed" | "PE-backed" | "Publicly traded" etc.
  };

  team: {
    ceo_name: string;
    ceo_background: string; // 1-2 sentences
    founder_names: string[];
  };

  competitive: {
    market_position: string;
    direct_competitors: {
      name: string;
      differentiator: string; // how they differ FROM the target
    }[];
  };

  market: {
    tailwinds: string[];        // max 3
    headwinds: string[];        // max 3
    tam_estimate: string | null; // "$40B" | null — never estimated
  };

  news: {
    sentiment: "Positive" | "Neutral" | "Negative";
    summary: string;            // 2-3 sentence analyst narrative
    recent_events: RecentEvent[]; // up to 4, structured { date, event }
  };

  defensibility: {
    moat_signals: string[];       // [] if none
    key_partnerships: string[];   // [] if none
    leadership_changes: string | null; // null = no change | "CEO X replaced by Y, March 2025"
  };

  ecosystem: {
    nodes: EcosystemNode[]; // [] if no data — never fabricated
  };

  fit_score: {
    score: "Strong" | "Moderate" | "Weak";
    sector_match: string;         // "FinTech" | "Healthcare" | actual sector | "None"
    strategy_match: "VC" | "PE" | "Credit" | "None";
    geography: string;            // "Canada" | "North America" | "USA" etc.
    rationale: string;            // 2-3 sentences — most important field
    portfolio_context: string;    // one sentence on Sagard portfolio overlap
  };

  confidence: {
    score: "High" | "Medium" | "Low";
    note: string; // one sentence on what was strong and what was weak
  };
}