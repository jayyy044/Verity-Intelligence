import SectionLabel from "@/components/shared/SectionLabel";

type marketInfo = {
  tailwinds: string[];
  headwinds: string[];
  tam_estimate: string | null;
}

type Competitor = {
  name: string,
  differentiator: string,
}

type CompetitiveData =  {
  market_position: string,
  direct_competitors: Competitor[],
}

type DefensibilityData = {
  moat_signals : string[],
  key_partnerships: string[],
  leadership_changes: string | null
}

// Parent interface to wrap them all
interface MarketData {
  market: marketInfo,
  competitive: CompetitiveData,
  defensibility: DefensibilityData,
}
export default function MarketSection({ market, competitive, defensibility }:  MarketData) {
  return (

    <div className="py-[13px] px-[18px] border-b border-[var(--border)]">
    <SectionLabel>MARKET INTELLIGENCE</SectionLabel>
    
    {/* Market Position */}
    {competitive?.market_position && (
      <div className="bg-[var(--surface2)] py-2 px-2.5 mb-3">
        <div className="text-[13px] text-[var(--text4)] mb-[3px] font-mono font-bold tracking-[0.08em]">MARKET POSITION</div>
        <div className="text-[11.5px] text-[var(--text)] font-sans tracking-[0.05em]">{competitive.market_position}</div>
      </div>
    )}

    {/* Tailwinds */}
    {market?.tailwinds?.length > 0 && (
      <div className="mb-3">
        <div className="text-[13px] text-[var(--green)] tracking-[0.04em] mb-[5px] font-mono">TAILWINDS</div>
        <div className="flex flex-col gap-1">
          {market.tailwinds.map((item, i) => (
            <div key={i} className="flex items-center gap-2 ">
              <span className="text-[var(--green)] text-[15px] mb-0.5">+</span>
              <span className="text-[12px] text-[var(--text2)] font-sans leading-[1.4]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Headwinds */}
    {market?.headwinds?.length > 0 && (
      <div className="mb-3">
        <div className="text-[13px] text-[var(--red)] tracking-[0.04em] mb-[5px] font-mono">HEADWINDS</div>
        <div className="flex flex-col gap-1">
          {market.headwinds.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[var(--red)] text-[15px]">-</span>
              <span className="text-[12px] text-[var(--text2)] font-sans leading-[1.4]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Moat Signals */}
    {defensibility?.moat_signals?.length > 0 && (
      <div className="mb-3">
        <div className="text-[13px] text-[var(--gold)] tracking-[0.04em] mb-[5px] font-mono">DEFENSIBILITY</div>
        <div className="flex flex-wrap gap-1.5">
          {defensibility.moat_signals.map((signal, i) => (
            <span 
              key={i}
              className="text-[11.5px] py-[4px] px-2.5 font-mono border border-[var(--gold-border)] text-[var(--gold)] bg-[var(--gold-bg)]"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Key Partnerships */}
    {defensibility?.key_partnerships?.length > 0 && (
      <div>
        <div className="text-[13px] text-[var(--text4)] tracking-[0.04em] mb-[5px] font-mono">KEY PARTNERSHIPS</div>
        <div className="flex flex-wrap gap-1">
          {defensibility.key_partnerships.map((partner, i) => (
            <span 
              key={i}
              className="text-[11.5px] py-[3px] px-2 font-mono border border-[var(--border)] text-[var(--text3)] bg-[var(--surface2)]"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
  );
}
