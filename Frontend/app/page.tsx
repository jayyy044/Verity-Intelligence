import Logo from "@/components/shared/Logo";
import SearchBar from "@/components/search/SearchBar";
import StatsStrip from "@/components/search/StatsStrip";

export default function SearchLandingPage() {
  return (
    <div className="w-full bg-[var(--bg)] min-h-screen flex flex-col border border-[var(--border)]">
      {/* Navigation */}
      <nav className="flex items-center justify-between py-3.5 px-8 border-b border-[var(--border)]">
        <Logo />
        <div className="text-[13px] text-[var(--text4)] tracking-[0.03em] font-mono font-bold">
          PRIVATE COMPANY RESEARCH &middot; V1.0
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center py-[60px] px-8">
        {/* Eyebrow Tag */}
        <div className="text-[10px] text-[var(--gold)] tracking-[0.2em] mb-5 border border-[var(--gold-border)] py-1 px-3.5 bg-[var(--gold-bg)] font-mono">
          COMPANY SCREENING TOOL
        </div>

        {/* Headline */}
        <h1 className="font-serif text-[42px] font-light text-[var(--text)] text-center leading-[1.15] mb-2.5">
          {"Map any company's"}
          <br />
          <em className="text-[var(--gold)] italic">competitive ecosystem</em>
          <br />
          in 60 seconds
        </h1>

        {/* Subline */}
        <p className="text-[12px] text-[var(--text3)] text-center tracking-[0.04em] mb-11 max-w-[460px] leading-[1.7] font-sans">
          Enter a company name to receive a live-researched intelligence brief,
          ecosystem map, and Sagard thesis fit score — replacing 30–45 minutes
          of manual research.
        </p>

        {/* Search Bar */}
        <SearchBar />

        {/* Stats Strip */}
        <StatsStrip />
      </main>
    </div>
  );
}
