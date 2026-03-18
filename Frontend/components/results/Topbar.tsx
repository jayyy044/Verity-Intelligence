"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/shared/Logo";
import FitBadge from "@/components/shared/FitBadge";

export type FitLevel = "strong" | "moderate" | "weak";

export default function Topbar({
  companyName,
  fitLevel = "strong",
}: {
  companyName: string;
  fitLevel?: FitLevel;
}) {
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between py-3.5 px-8 border-b border-[var(--border)]">
      <div className="flex items-center gap-4">
        <Logo/>
        <div className="w-px h-[18px] bg-[var(--border)]" />
        <div className="text-[13px] text-[var(--text)] tracking-[0.01em] font-mono">
          {companyName}
        </div> 
      </div>
      <div className="flex items-center gap-3">

         <FitBadge level={fitLevel} />
         <button
          onClick={() => router.push("/")}
          className=" font-bold text-[12.5px] text-[var(--text3)] tracking-[0.01em] border border-[var(--border)] py-1 px-3 cursor-pointer bg-transparent font-mono hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
        >
          NEW SEARCH
        </button>
      </div>
    </nav>
  //   <div className="flex items-center justify-between py-[11px] px-6 border-b border-[var(--border)] bg-[var(--bg)]">
  //     <div className="flex items-center gap-4">
  //       <Logo/>
  //       <div className="w-px h-[18px] bg-[var(--border)]" />
  //       <div className="text-[11px] text-[var(--text)] tracking-[0.04em] font-mono">
  //         {companyName}
  //       </div>
  //     </div>
  //     <div className="flex items-center gap-3">
  //       <div className="text-[10px] text-[var(--text3)] tracking-[0.06em] font-mono">
  //         RESEARCHED 0.3s AGO
  //       </div>
  //       <FitBadge level={fitLevel} />
  //       <button
  //         onClick={() => router.push("/")}
  //         className="text-[10px] text-[var(--text3)] tracking-[0.06em] border border-[var(--border)] py-1 px-3 cursor-pointer bg-transparent font-mono hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
  //       >
  //         &larr; NEW SEARCH
  //       </button>
  //     </div>
  //   </div>
  );
}
