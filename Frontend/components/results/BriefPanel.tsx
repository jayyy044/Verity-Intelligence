// import CompanyProfile from "./brief/CompanyProfile";
// import FitScore from "./brief/FitScore";
// import MarketSection from "./brief/MarketSection";
// import NewsSection from "./brief/NewsSection";
// import ConfidenceFooter from "./brief/ConfidenceFooter";

// export default function BriefPanel({
//   companyName,
//   data,
// }: {
//   companyName: string;
//   data: any;
// }) {
//   return (
//     <div className="flex flex-col overflow-y-auto bg-[var(--surface)] brief-scrollbar h-full">
//       {/* Header */}
//       <div className="py-3.5 px-[18px] border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10">
//         <div className="font-serif text-[19px] font-light text-[var(--text)] mb-0.5">
//           {companyName}
//         </div>
//         <div className="text-[10px] text-[var(--text3)] tracking-[0.04em] font-mono">
//           {data.stage} &middot; {data.sector} &middot; {data.location}
//         </div>
//       </div>

//       {/* Sections */}
//       <CompanyProfile data={data.profile} />
//       <FitScore data={data.fit} />
//       <MarketSection data={data.market} />
//       <NewsSection data={data.news} />

//       {/* Footer */}
//       <ConfidenceFooter
//         level={data.confidence.level}
//         notes={data.confidence.notes}
//       />
//     </div>
//   );
// }


import CompanyProfile from "./brief/CompanyProfile";
import FitScore from "./brief/FitScore";
import MarketSection from "./brief/MarketSection";
import NewsSection from "./brief/NewsSection";
import ConfidenceFooter from "./brief/ConfidenceFooter";
import { IntelligenceReport } from "@/types/report";

export default function BriefPanel({ data }: { data: IntelligenceReport }) {
  // const stageTag = (data.revenue_stage ?? data.funding.ownership_type ?? "—").toUpperCase();
  // const sectorTag = data.company.sector.toUpperCase();
  // const locationTag = data.company.hq.toUpperCase();
  console.log('BreifPanel', data)
  return (

    //   {/* Sections — each receives the full report */}
    //   {/* <CompanyProfile data={data.company} /> */}
    //    {/*<FitScore data={data} />*/}
    //   {/* <MarketSection data={data} /> */}
    //   {/* <NewsSection data={data} />  */}

    //   {/* Footer */}
    //   {/* <ConfidenceFooter
    //     level={data.confidence.toLowerCase() as "high" | "medium" | "low"}
    //     notes={data.confidence_note}
    //   /> */}
    // </div>

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

    
  </div>
  );
}