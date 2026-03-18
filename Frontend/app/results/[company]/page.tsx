// import Topbar from "@/components/results/Topbar";
// import EcosystemMap from "@/components/results/EcosystemMap";
// import BriefPanel from "@/components/results/BriefPanel";

// // Sample data for demonstration
// const getMockData = (companyName: string) => ({
//   stage: "GROWTH STAGE",
//   sector: "FINTECH",
//   location: "TORONTO, ON",
//   profile: {
//     description:
//       "Canada's largest digital investment platform offering commission-free stock trading, automated investing, tax filing, and crypto trading.",
//     hq: "Toronto, ON",
//     founded: "2014",
//     headcount: "~900",
//     stage: "Growth",
//   },
//   fit: {
//     level: "strong",
//     tags: [
//       { label: "FinTech", match: true },
//       { label: "PE", match: true },
//       { label: "North America", match: false },
//     ],
//     rationale:
//       "Strong thesis fit across Sagard's FinTech focus. Sagard Wealth Partners creates a natural synergy angle on HNW client acquisition and digital distribution.",
//   },
//   market: {
//     tam: "$45B+",
//     vertical: "Neo-brokerage",
//     tailwinds:
//       "Rising retail investor participation · Digital-first wealth accumulation · Shift from high-fee advisors",
//     headwinds: "Rate pressure on trading volumes · Crypto regulatory scrutiny",
//   },
//   news: {
//     sentiment: "positive",
//     sentimentScore: 76,
//     items: [
//       {
//         type: "positive",
//         text: "Raised $750M Series E at $5B valuation — still benchmark for Canadian fintech",
//       },
//       {
//         type: "positive",
//         text: "Launched Wealthsimple Tax, expanding platform beyond investing",
//       },
//       {
//         type: "neutral",
//         text: "Partnership with major Canadian banks for account linking",
//       },
//     ],
//   },
//   confidence: {
//     level: "high",
//     notes:
//       "Strong web presence, multiple corroborating sources, confirmed funding history.",
//   },
// });

// type ResultsPageParams = {
//   company: string;
// };

// type ResultsPageProps = {
//   params: Promise<ResultsPageParams>;
// };

// export default async function ResultsPage({ params }: ResultsPageProps) {
//   await new Promise((resolve) => setTimeout(resolve, 5000));
//   const { company } = await params; // ✅ unwrap the Promise
//   const rawCompany = company || "company";
//   const companyName = rawCompany
//     .toString()
//     .replace(/-/g, " ")
//     .replace(/\b\w/g, (c: string) => c.toUpperCase());
//   const data = getMockData(companyName);

//   return (
//     <div className="w-full bg-[var(--bg)] border border-[var(--border)] flex flex-col h-screen">
//       <Topbar companyName={companyName} fitLevel={data.fit.level} />

//       <div className="grid grid-cols-[1fr_340px] flex-1 overflow-hidden">
//         <div className="border-r border-[var(--border)]">
//           <EcosystemMap companyName={companyName} />
//         </div>
//         <BriefPanel companyName={companyName} data={data} />
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Topbar from "@/components/results/Topbar";
import EcosystemMap from "@/components/results/EcosystemMap";
import BriefPanel from "@/components/results/BriefPanel";
import { IntelligenceReport } from "@/types/report";

type FitLevel = "strong" | "moderate" | "weak";
const toFitLevel = (score: unknown): FitLevel | undefined => {
  if (typeof score !== "string") return undefined;
  const s = score.toLowerCase();
  if (s === "strong" || s === "moderate" || s === "weak") return s;
  return undefined;
};

export default function ResultsPage() {
  const { company: slug } = useParams<{ company: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const companyName =
    searchParams.get("name") ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`report:${slug}`);

    if (!raw) {
      setError(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      // Server sends full pipeline output — intelligence_report is nested inside
      setReport(parsed.intelligence_report ?? parsed);
    } catch {
      setError(true);
    }
  }, [slug]);

  console.log(report, "bello")

  // ── Error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center font-mono text-[13px] text-[var(--text4)]">
          <p className="mb-4">
            No report found for{" "}
            <em className="text-[var(--text2)]">{companyName}</em>.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-[var(--gold)] underline"
          >
            Search again
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--bg)]">
        <span className="font-mono text-[13px] text-[var(--text4)] animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="w-full bg-[var(--bg)] border border-[var(--border)] flex flex-col h-screen">
      <Topbar
        companyName={report.company.name}
        fitLevel={toFitLevel(report.fit_score?.score)}
      />
      <div className="grid grid-cols-[1fr_340px] flex-1 overflow-hidden">
        <div className="border-r border-[var(--border)]">
          {/* <EcosystemMap nodes={report.ecosystem.nodes} /> */}
        </div>
        {/* <BriefPanel data={report} /> */}
      </div>
    </div>
  );
}