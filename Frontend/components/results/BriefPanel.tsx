import CompanyProfile from "./brief/CompanyProfile";
import FitScore from "./brief/FitScore";
import MarketSection from "./brief/MarketSection";
import NewsSection from "./brief/NewsSection";
import ConfidenceFooter from "./brief/ConfidenceFooter";
import { IntelligenceReport } from "@/types/report";

export default function BriefPanel({ data }: { data: IntelligenceReport }) {
  return (
    <div className="flex flex-col overflow-y-auto bg-[var(--surface)] brief-scrollbar h-full">
    {/* Header */}
      <div className="py-3.5 px-[18px] border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10">
        <div className="font-serif text-[25px] font-light text-[var(--text)] mb-0.5 py-1 ">
          {data.identity?.name}
        </div>
        <div className="text-[13px] text-[var(--text3)] tracking-[0.01em] font-mono flex items-center gap-1.5">
          <span>{data.identity?.business_model}</span>
          <span className="opacity-50">/</span>
          <span>{data.identity?.sector}</span>
          <span className="opacity-50">/</span>
          <a 
            href={`https://${data.identity?.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--gold)] hover:underline"
          >
            {data.identity?.website}
          </a>
        </div>
      </div>

      <CompanyProfile 
        identity={data.identity} 
        funding={data.funding} 
        team={data.team} 
      />

      <FitScore fitScore={data.fit_score} />

      <MarketSection 
        market={data.market} 
        competitive={data.competitive}
        defensibility={data.defensibility}
      />

    
  </div>
  );
}