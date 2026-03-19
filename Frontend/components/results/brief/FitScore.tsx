import SectionLabel from "@/components/shared/SectionLabel";

type FitScoreData = {
  score: "Strong" | "Moderate" | "Weak";
  sector_match: string; // e.g., "FinTech" or "None"
  strategy_match: string,
  geography: string;    // e.g., "Canada"
  rationale: string;    // The detailed analysis text
  portfolio_context: string; // Conflict or overlap check
};
export default function FitScore({ fitScore }: { fitScore: FitScoreData }) {
  const badgeStyles = {
    Strong: {
      bg: "rgba(61,184,122,0.12)",
      text: "#3DB87A",
      border: "rgba(61,184,122,0.25)",
      label: "STRONG",
    },
    Moderate: {
      bg: "rgba(245,158,11,0.12)",
      text: "#F59E0B",
      border: "rgba(245,158,11,0.25)",
      label: "MODERATE",
    },
    Weak: {
      bg: "rgba(224,82,82,0.12)",
      text: "#E05252",
      border: "rgba(224,82,82,0.25)",
      label: "WEAK",
    },
  };

  const badge = badgeStyles[fitScore.score];

  return (
    <div className="py-[13px] px-[18px] border-b border-[var(--border)]">
      <SectionLabel>THESIS FIT SCORE</SectionLabel>
      <div className="bg-[var(--surface2)] border-l-2 border-l-[var(--gold)] py-2.5 px-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[13px] text-[var(--text4)] tracking-[0.08em] font-mono font-bold">
            SAGARD FIT
          </div>
          <div
            className="text-[11.5px] font-medium py-[3px] px-2.5 font-mono"
            style={{
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
            }}
          >
            {badge.label}
          </div>
        </div>
        <p className="text-[12px] text-[var(--text2)] leading-[1.5] font-sans mt-2.5">
          {fitScore.rationale}
        </p>
        {fitScore?.portfolio_context && (
          <p className="text-[12px] text-[var(--gold)] leading-[1.5] font-mono mt-2 opacity-80">
            {fitScore.portfolio_context}
          </p>
        )}
      </div>
    </div>
  );
}
