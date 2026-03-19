import SectionLabel from "@/components/shared/SectionLabel";

type CompanyData = {
  name: string;
  website: string;
  hq: string;
  founded: string;
  description: string;
  business_model: string;
  sector: string;
  vertical: string;
  headcount: string | null;
  revenue_stage: string | null;
};

// Also defining funding and team if you plan to use them in this specific component later
type FundingData = {
  total_raised: string;
  last_round: {
    series: string;
    amount: string;
    date: string;
  };
  key_investors: string[];
  ownership_type: string;
};

interface CompanyProfileProps {
  identity: CompanyData;
  funding?: FundingData; // Optional if not used in the UI yet
  team?: any;           // Optional
}

export default function CompanyProfile({ identity, funding, team }: CompanyProfileProps) {
  return (
    <div className="py-[13px] px-[18px] border-b border-[var(--border)]">
      <SectionLabel>COMPANY PROFILE</SectionLabel>
      <p className="text-[13px] text-[var(--text2)] leading-[1.25] mb-2.5 font-sans">
        {identity.description}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-[var(--surface2)] py-[7px] px-2.5">
          <div className="text-[11px] text-[var(--text2)] mb-0.5 font-mono font-bold tracking-[0.05em]">
            Founded
          </div>
          <div className="text-[12px] text-[var(--text)] font-mono">
            {identity.founded}
          </div>
        </div>
        <div className="bg-[var(--surface2)] py-[7px] px-2.5">
          <div className="text-[11px] text-[var(--text2)] mb-0.5 font-mono font-bold tracking-[0.05em]">
            Location 
          </div>
          <div className="text-[12px] text-[var(--text)] font-mono">
            {identity.hq.toUpperCase()}
          </div>
        </div>
        <div className="bg-[var(--surface2)] py-[7px] px-2.5">
          <div className="text-[11px] text-[var(--text2)] mb-0.5 font-mono font-bold tracking-[0.05em]">
            Vertical 
          </div>
          <div className="text-[12px] text-[var(--text)] font-mono">
            {identity.vertical}
          </div>
        </div>
        <div className="bg-[var(--surface2)] py-[7px] px-2.5">
          <div className="text-[11px] text-[var(--text2)] mb-0.5 font-mono font-bold tracking-[0.05em]">
            Headcount 
          </div>
          <div className="text-[12px] text-[var(--text)] font-mono">
            {`~ ${identity.headcount || 'Not Found'} `}
          </div>
        </div> 
      </div>

      {funding ? (
        <div className="mb-3 mt-5 px-[1px]">
          <div className="text-[14.5px] text-[var(--gold)] tracking-[0.04em] mb-1.5 font-mono font-bold">FUNDING</div>
          <div className="bg-[var(--surface2)] border-l-2 border-l-[var(--gold)] py-2 px-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[var(--text3)] font-mono">Last Round</span>
              <span className="text-[11.5px] tracking-[0.1em] text-[var(--text)] font-mono font-medium">
                {funding.last_round?.series} - {funding.last_round?.amount}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[var(--text3)] font-mono">Date</span>
              <span className="text-[11.5px] tracking-[0.1em] text-[var(--text)] font-mono">{funding.last_round?.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--text3)] font-mono">Ownership</span>
              <span className="text-[11.5px] tracking-[0.1em] text-[var(--text)] font-mono">{funding.ownership_type}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 text-[15px] text-[var(--text4)] font-mono italic">No funding data available</div>
      )}

      {team ? (
        <div>
          <div className="text-[14.5px] text-[var(--text4)] tracking-[0.04em] mb-1.5 font-mono font-bold">LEADERSHIP</div>
          <div className="bg-[var(--surface2)] py-2 px-3">
            <div className="text-[13px] text-[var(--text)] font-mono font-medium mb-1">{team.ceo_name}</div>
            <div className="text-[12px] text-[var(--text3)] font-sans leading-[1.4]">{team.ceo_background}</div>
          </div>
        </div>
      ) : (
        <div className="mt-5 text-[15px] text-[var(--text4)] font-mono italic">No leadership data available</div>
      )}
    </div>
  );
}
