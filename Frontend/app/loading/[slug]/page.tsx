"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/Logo";

const researchSteps = [
  "Initializing research pipeline",
  "Searching company profile & business model",
  "Mapping competitive landscape",
  "Identifying ecosystem relationships",
  "Scanning news & sentiment signals",
  "Checking Sagard portfolio overlap",
  "Scoring investment thesis fit",
  "Synthesizing intelligence brief",
];

export default function LoadingPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const params = useSearchParams();
  const router = useRouter();
  const companyName = params.get("name") ?? "company";
  const descriptor = params.get("descriptor") ?? "";
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const slug = companyName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    (async () => {
      try {
        const res = await fetch("http://localhost:5000/research/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: companyName, descriptor }),
        });

        if (!res.ok || !res.body) {
          console.error("[LoadingPage] Bad response from server:", res.status);
          router.push(`/?error=${encodeURIComponent("Server Error")}`);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;

            let event: { step: number | "done" | "error"; data?: unknown; message?: string };
            try {
              event = JSON.parse(line.slice("data:".length).trim());
            } catch {
              continue;
            }

            if (event.step === "error") {
                console.error("[LoadingPage] Pipeline error:", event.message || "Unknown Error");
                router.push(`/?error=${encodeURIComponent("Server Error")}`);
                return;
            }

            if (event.step === "done") {
              setCompletedSteps((prev) => [...prev, researchSteps.length - 1]);

              if (event.data) {
                sessionStorage.setItem(`report:${slug}`, JSON.stringify(event.data));
              }

              router.push(`/results/${slug}?name=${encodeURIComponent(companyName)}`);
              return;
            }

            const stepIndex = event.step as number;
            setCompletedSteps((prev) =>
              stepIndex > 0 && !prev.includes(stepIndex - 1)
                ? [...prev, stepIndex - 1]
                : prev
            );
            setActiveStep(stepIndex);
          }
        }
      } catch (err) {
        console.error("[LoadingPage] Stream error:", err);
        router.push(`/?error=${encodeURIComponent("Server Error")}`);

      }
    })();
  }, [companyName, descriptor, router]);

  const progress = ((activeStep + 1) / researchSteps.length) * 100;

  return (
    <div className="w-full bg-[var(--bg)] min-h-screen flex flex-col border border-[var(--border)]">
      <nav className="flex items-center justify-between py-3.5 px-8 border-b border-[var(--border)] shrink-0">
        <Logo />
        <div className="text-[13px] text-[var(--text4)] tracking-[0.03em] font-mono font-bold">
          PRIVATE COMPANY RESEARCH &middot; V1.0
        </div>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center py-[60px] px-8 min-h-0">
        <div className="w-full max-w-[420px]">
          <h2 className="font-serif text-[20px] font-light text-[var(--text)] mb-8 text-center">
            Researching <em className="text-[var(--gold)] italic">{companyName}</em>...
          </h2>
          <div className="mb-6">
            {researchSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isActive = activeStep === index;
              const isPending = index > activeStep;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2.5 border-b border-[var(--border)] font-mono text-[12px]"
                  style={{
                    opacity: isPending ? 0.25 : 1,
                    transform: isPending ? "translateX(-8px)" : "translateX(0)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 text-center"
                      style={{
                        color: isCompleted ? "var(--green)" : isActive ? "var(--gold)" : "var(--text4)",
                      }}
                    >
                      {isCompleted ? "✓" : isActive ? "›" : "·"}
                    </span>
                    <span className="text-[var(--text2)]">{step}</span>
                  </div>
                  {isActive && (
                    <span className="text-[var(--gold)] animate-pulse">…</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full h-0.5 bg-[var(--border)]">
            <div
              className="h-full bg-[var(--gold)] transition-all duration-600 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}