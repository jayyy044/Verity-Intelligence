"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const sampleCompanies = [
  { company: "wealthsimple.com", descriptor: "Canadian fintech wealth management investing" },
  { company: "league.com", descriptor: "League Inc digital health benefits AI platform Canada Michael Serbinis" },
  { company: "coherehealth.com", descriptor: "healthcare AI prior authorization" },
  { company: "nuvei.com", descriptor: "Canadian fintech payment processing" },
];

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [descriptor, setDescriptor] = useState("");
  const router = useRouter();
  const typingTimersRef = useRef<number[]>([]);

  const clearTypingTimers = () => {
    for (const id of typingTimersRef.current) window.clearTimeout(id);
    typingTimersRef.current = [];
  };

  const typeInto = (
    text: string,
    setter: (value: string) => void,
    { startDelayMs = 0, charDelayMs = 20 }: { startDelayMs?: number; charDelayMs?: number } = {}
  ) => {
    const t = text ?? "";
    for (let i = 0; i <= t.length; i++) {
      const id = window.setTimeout(() => setter(t.slice(0, i)), startDelayMs + i * charDelayMs);
      typingTimersRef.current.push(id);
    }
  };

  useEffect(() => clearTypingTimers, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const slug = trimmed
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    router.push(
      `/loading/${slug}?name=${encodeURIComponent(trimmed)}&descriptor=${encodeURIComponent(descriptor.trim())}`
    );
  };

  const handlePillClick = (company: string, desc: string) => {
    clearTypingTimers();
    setQuery("");
    setDescriptor("");

    typeInto(company, setQuery, { charDelayMs: 40 });
    typeInto(desc, setDescriptor, { charDelayMs: 30 });
  };

  return (
    <div className="w-full max-w-[50vw]">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col items-left border border-[var(--border2)] bg-[var(--surface)] has-[button:hover]:border-[var(--gold)] has-[button:focus]:border-[var(--gold)] px-[18px]">
          <div className="flex flex-col">
            <p className="text-[12px] text-[#444A56] tracking-[0.14em] py-[10px] mt-[15px]">COMPANY NAME</p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Company Website  (e.g. wealthsimple.com)"
              className="flex-1 w-full bg-[#0A0B0D] border border-[#1E2128] outline-none text-[var(--text)] font-mono text-[13px] py-[10px] px-[18px] tracking-[0.02em] placeholder:text-[var(--text4)] hover:border-[var(--gold)] focus:border-[var(--gold)]"
            />
          </div>
          <div className="flex flex-col">
            <p className="text-[12px] text-[#444A56] tracking-[0.14em] py-[10px]">DESCRIPTOR</p>
            <input
              type="text"
              value={descriptor}
              onChange={(e) => setDescriptor(e.target.value)}
              placeholder="Enter Brief Company Description  (e.g.'payment processing fintech')"
              className="flex-1 w-full bg-[#0A0B0D] border border-[#1E2128] outline-none text-[var(--text)] font-mono text-[13px] py-[10px] px-[18px] tracking-[0.02em] placeholder:text-[var(--text4)] hover:border-[var(--gold)] focus:border-[var(--gold)]"
            />
          </div>
          <button
            type="submit"
            className="w-[100px] mx-auto mt-[20px] mb-[15px] bg-[var(--gold)] border-none text-black font-mono text-[11px] font-medium px-6 py-[10px] tracking-[0.08em] cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            MAP IT &rarr;
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 flex-wrap justify-center mt-4">
        <span className="text-[15px] text-[var(--text4)] tracking-[0.06em] font-mono font-bold">
          TRY:
        </span>
        {sampleCompanies.map(({ company, descriptor: desc }) => (
          <button
            key={company}
            onClick={() => handlePillClick(company, desc)}
            className="border border-[var(--border)] bg-transparent text-[var(--text3)] font-mono text-[15px] py-1 px-3 cursor-pointer tracking-[-0.5px] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors"
          >
            {company}
          </button>
        ))}
      </div>
    </div>
  );
}