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
      setReport(JSON.parse(raw));
    } catch {
      setError(true);
    }
  }, [slug]);

  // ── Error / Loading ───────────────────────────────────────────
  if (error) {
    router.push(`/?error=${encodeURIComponent("Report not found for " + companyName)}`);
    return null;
  }

  if (!report) return null;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="w-full bg-[var(--bg)] border border-[var(--border)] flex flex-col h-screen">
      <Topbar
        companyName={report.identity.name}
        fitLevel={toFitLevel(report.fit_score?.score)}
      />
      <div className="grid grid-cols-[68vw_32vw] flex-1 overflow-hidden">
        <div className="border-r border-[var(--border)]">
          <EcosystemMap
            companyName={report.identity.name}
            nodes={report.ecosystem.nodes}
          />
        </div>
        <BriefPanel data={report} />
      </div>
    </div>
  );
}