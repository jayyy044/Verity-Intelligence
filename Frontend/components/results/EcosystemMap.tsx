"use client";

import { EcosystemNode } from "@/types/report";

// ── Canvas + layout constants ────────────────────────────────
// Canvas: 1000 × 560
// Left box:  x=10..250   → centre=130, inner safe x: 10+70=80 .. 250-70=180
// Right box: x=750..990  → centre=870, inner safe x: 750+70=820 .. 990-70=920
// Target stays at cx=500 (true centre of 1000px canvas)
const TARGET   = { cx: 500, cy: 280 };
const LEFT_CX  = 130;   // centre of left box
const RIGHT_CX = 870;   // centre of right box
const BOX_TOP  = 40;
const BOX_BOT  = 520;
const NODE_PAD = 70;    // half box-width (120) minus max-radius (52) = 68, round up
const SAFE_TOP = BOX_TOP + NODE_PAD;
const SAFE_BOT = BOX_BOT - NODE_PAD;

// ── Helpers ──────────────────────────────────────────────────
function columnY(index: number, total: number): number {
  if (total === 1) return (SAFE_TOP + SAFE_BOT) / 2;
  return SAFE_TOP + index * ((SAFE_BOT - SAFE_TOP) / (total - 1));
}

function splitName(name: string): [string, string] {
  const words = name.split(" ");
  if (words.length === 1) return [name, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// fontSize 9, IBM Plex Mono ≈ 5.4px/char — clamped 28–52
function nodeRadius(name: string): number {
  const [l1, l2] = splitName(name);
  const longest  = Math.max(l1.length, l2.length);
  return Math.min(Math.max(Math.ceil((longest * 5.4) / 2) + 12, 28), 52);
}

// fontSize 11, IBM Plex Mono ≈ 6.6px/char — clamped 42–70
function targetRadius(name: string): number {
  const [l1, l2] = splitName(name);
  const longest  = Math.max(l1.length, l2.length);
  return Math.min(Math.max(Math.ceil((longest * 6.6) / 2) + 16, 42), 70);
}

// ── Component ────────────────────────────────────────────────
export default function EcosystemMap({ nodes }: { nodes: EcosystemNode[] }) {
  const competitors = nodes.filter((n) => n.type === "competitor").slice(0, 5);
  const ecosystem   = nodes.filter((n) => n.type === "ecosystem").slice(0, 5);
  const targetNode  = nodes.find((n) => n.type === "target");
  const targetName  = targetNode?.name ?? "";
  const tR          = targetRadius(targetName);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center py-2.5 px-[18px] border-b border-[var(--border)] shrink-0 bg-[var(--bg)]">
        <div className="text-[12px] text-[var(--text4)] tracking-[0.02em] font-mono font-bold">
          ECOSYSTEM MAP
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(26, 29, 36, 0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(26, 29, 36, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundColor: "var(--bg)",
        }}
      >
        <svg
          viewBox="0 0 1000 560"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.18" />
              <stop offset="70%"  stopColor="#F59E0B" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="competitorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E05252" stopOpacity="0.10" />
              <stop offset="60%"  stopColor="#E05252" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#E05252" stopOpacity="0.02" />
            </radialGradient>
            <radialGradient id="ecosystemGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#4A90E2" stopOpacity="0.10" />
              <stop offset="60%"  stopColor="#4A90E2" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* ── Region boxes ───────────────────────────────── */}
          <rect x={10} y={BOX_TOP} width={240} height={BOX_BOT - BOX_TOP} rx="6" fill="url(#competitorGlow)" />
          <rect x={10} y={BOX_TOP} width={240} height={BOX_BOT - BOX_TOP} rx="6" fill="none" stroke="#E05252" strokeWidth="0.5" strokeDasharray="4,6" opacity="0.35" />
          <text x={LEFT_CX}  y={BOX_TOP - 10} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#E05252" opacity="0.7" letterSpacing="0.01em">COMPETITORS</text>

          <rect x={750} y={BOX_TOP} width={240} height={BOX_BOT - BOX_TOP} rx="6" fill="url(#ecosystemGlow)" />
          <rect x={750} y={BOX_TOP} width={240} height={BOX_BOT - BOX_TOP} rx="6" fill="none" stroke="#4A90E2" strokeWidth="0.5" strokeDasharray="4,6" opacity="0.35" />
          <text x={RIGHT_CX} y={BOX_TOP - 10} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#4A90E2" opacity="0.7" letterSpacing="0.01em">ECOSYSTEM</text>

          {/* ── Target glow ────────────────────────────────── */}
          <circle cx={TARGET.cx} cy={TARGET.cy} r="110" fill="url(#targetGlow)" />

          {/* ── Connection lines — competitors → target ─────── */}
          {competitors.map((node, i) => {
            const cy = columnY(i, competitors.length);
            const r  = nodeRadius(node.name);
            return (
              <line
                key={`cl-${i}`}
                x1={LEFT_CX + r}       y1={cy}
                x2={TARGET.cx - tR}    y2={TARGET.cy}
                stroke="#2A2E38" strokeWidth="1" opacity="0.55"
              />
            );
          })}

          {/* ── Connection lines — ecosystem → target ───────── */}
          {ecosystem.map((node, i) => {
            const cy = columnY(i, ecosystem.length);
            const r  = nodeRadius(node.name);
            return (
              <line
                key={`el-${i}`}
                x1={RIGHT_CX - r}      y1={cy}
                x2={TARGET.cx + tR}    y2={TARGET.cy}
                stroke="#2A2E38" strokeWidth="1" opacity="0.55"
              />
            );
          })}

          {/* ── Pulse ring ──────────────────────────────────── */}
          <circle cx={TARGET.cx} cy={TARGET.cy} r="55" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.15">
            <animate attributeName="r"       values="55;72;55"       dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.04;0.15" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* ── Target node ─────────────────────────────────── */}
          {(() => {
            const [l1, l2] = splitName(targetName);
            const hasTwo   = l2.length > 0;
            const textY    = hasTwo ? TARGET.cy - 7 : TARGET.cy + 4;
            return (
              <g>
                <circle cx={TARGET.cx} cy={TARGET.cy} r={tR}     fill="#0F0D08" />
                <circle cx={TARGET.cx} cy={TARGET.cy} r={tR}     fill="none" stroke="#F59E0B" strokeWidth="2" />
                <circle cx={TARGET.cx} cy={TARGET.cy} r={tR + 7} fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.25" />
                <text x={TARGET.cx} y={textY}      textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fontWeight="700" fill="#F59E0B">{l1}</text>
                {hasTwo && <text x={TARGET.cx} y={textY + 14} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fontWeight="700" fill="#F59E0B">{l2}</text>}
              </g>
            );
          })()}

          {/* ── Competitor nodes ────────────────────────────── */}
          {competitors.map((node, i) => {
            const cy     = columnY(i, competitors.length);
            const r      = nodeRadius(node.name);
            const [l1, l2] = splitName(node.name);
            const hasTwo = l2.length > 0;
            const textY  = hasTwo ? cy - 6 : cy + 4;
            return (
              <g key={`c-${i}`}>
                <circle cx={LEFT_CX} cy={cy} r={r} fill="#13151A" />
                <circle cx={LEFT_CX} cy={cy} r={r} fill="none" stroke="#E05252" strokeWidth="1.5" />
                <text x={LEFT_CX} y={textY}      textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="600" fill="#E05252">{l1}</text>
                {hasTwo && <text x={LEFT_CX} y={textY + 12} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="600" fill="#E05252">{l2}</text>}
              </g>
            );
          })}

          {/* ── Ecosystem nodes ─────────────────────────────── */}
          {ecosystem.map((node, i) => {
            const cy     = columnY(i, ecosystem.length);
            const r      = nodeRadius(node.name);
            const [l1, l2] = splitName(node.name);
            const hasTwo = l2.length > 0;
            const textY  = hasTwo ? cy - 6 : cy + 4;
            return (
              <g key={`e-${i}`}>
                <circle cx={RIGHT_CX} cy={cy} r={r} fill="#13151A" />
                <circle cx={RIGHT_CX} cy={cy} r={r} fill="none" stroke="#4A90E2" strokeWidth="1.5" />
                <text x={RIGHT_CX} y={textY}      textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="600" fill="#4A90E2">{l1}</text>
                {hasTwo && <text x={RIGHT_CX} y={textY + 12} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fontWeight="600" fill="#4A90E2">{l2}</text>}
              </g>
            );
          })}

        </svg>
      </div>
    </div>
  );
}