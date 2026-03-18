// src/types/report.ts
// Single source of truth for the IntelligenceReport shape.
// Import into: BriefPanel, CompanyProfile, FitScore,
// MarketSection, NewsSection, EcosystemMap, results page.

export interface EcosystemNode {
  name: string;
  type: "target" | "competitor" | "ecosystem" | "sagard";
  relationship: string;
}

export interface IntelligenceReport {
  // ── Tier 1 ──────────────────────────────────────────────────
  company: {
    name: string;
    website: string;
    hq: string;             // "Toronto, Canada"
    founded: string;        // "September 2014" or "2014"
    description: string;
    business_model: string; // "B2C FinTech platform"
    sector: string;         // "FinTech"
    vertical: string;       // "Wealth Management"
  };
  funding: {
    total_raised: string;
    last_round: { series: string; amount: string; date: string };
    key_investors: string[];
    ownership_type: string;
  };
  competitive: {
    market_position: string;
    direct_competitors: { name: string; differentiator: string }[];
  };
  team: {
    ceo_name: string;
    ceo_background: string;
    founder_names: string[];
  };
  news: {
    sentiment: "Positive" | "Neutral" | "Negative";
    summary: string;
    recent_events: string[];
  };
  fit_score: {
    score: "Strong" | "Moderate" | "Weak";
    sector_match: string;
    strategy_match: string;
    geography: string;
    rationale: string;
  };
  ecosystem: { nodes: EcosystemNode[] };
  confidence: "High" | "Medium" | "Low";
  confidence_note: string;

  // ── Tier 2 ──────────────────────────────────────────────────
  headcount: string | null;
  revenue_stage: string | null;
  market: {
    tam_estimate: string | null;
    tailwinds: string[];
    headwinds: string[];
  };
  moat_signals: string[];
  leadership_changes: boolean;
  key_partnerships: string[];
}
