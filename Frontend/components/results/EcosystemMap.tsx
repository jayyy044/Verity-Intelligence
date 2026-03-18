// "use client";

// export default function EcosystemMap({ companyName }: { companyName: string }) {
//   return (
//     <div className="flex flex-col bg-[var(--bg)] h-full">
//       {/* Header */}
//       <div className="flex items-center py-2.5 px-[18px] border-b border-[var(--border)]">
//         <div className="text-[10px] text-[var(--text4)] tracking-[0.12em] font-mono">
//           ECOSYSTEM MAP
//         </div>
//       </div>

//       {/* Map Canvas */}
//       <div className="flex-1 relative overflow-hidden">
//         <svg
//           viewBox="0 0 640 480"
//           xmlns="http://www.w3.org/2000/svg"
//           className="w-full h-8/12"
//         >
//           <defs>
//             {/* Gradients for regions */}
//             <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
//               <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
//               <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.05" />
//               <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
//             </radialGradient>

//             <radialGradient id="competitorGlow" cx="50%" cy="50%" r="50%">
//               <stop offset="0%" stopColor="#E05252" stopOpacity="0.08" />
//               <stop offset="70%" stopColor="#E05252" stopOpacity="0.03" />
//               <stop offset="100%" stopColor="#E05252" stopOpacity="0" />
//             </radialGradient>

//             <radialGradient id="ecosystemGlow" cx="50%" cy="50%" r="50%">
//               <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.08" />
//               <stop offset="70%" stopColor="#4A90E2" stopOpacity="0.03" />
//               <stop offset="100%" stopColor="#4A90E2" stopOpacity="0" />
//             </radialGradient>

//             <radialGradient id="sagardGlow" cx="50%" cy="50%" r="50%">
//               <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.12" />
//               <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.04" />
//               <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
//             </radialGradient>

//             {/* Subtle grid pattern */}
//             <pattern
//               id="grid"
//               width="40"
//               height="40"
//               patternUnits="userSpaceOnUse"
//             >
//               <path
//                 d="M 40 0 L 0 0 0 40"
//                 fill="none"
//                 stroke="#1A1D24"
//                 strokeWidth="0.5"
//               />
//             </pattern>

//             {/* Connection line gradient */}
//             <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
//               <stop offset="0%" stopColor="#2A2E38" stopOpacity="0.2" />
//               <stop offset="50%" stopColor="#2A2E38" stopOpacity="0.6" />
//               <stop offset="100%" stopColor="#2A2E38" stopOpacity="0.2" />
//             </linearGradient>
//           </defs>

//           {/* Background grid */}
//           <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

//           {/* COMPETITORS REGION - Top */}
//           <ellipse
//             cx="300"
//             cy="95"
//             rx="200"
//             ry="85"
//             fill="url(#competitorGlow)"
//           />
//           <ellipse
//             cx="300"
//             cy="95"
//             rx="200"
//             ry="85"
//             fill="none"
//             stroke="#E05252"
//             strokeWidth="0.5"
//             strokeDasharray="3,6"
//             opacity="0.4"
//           />
//           <text
//             x="135"
//             y="45"
//             fontFamily="IBM Plex Mono, monospace"
//             fontSize="9"
//             fill="#E05252"
//             opacity="0.7"
//             letterSpacing="0.1em"
//           >
//             COMPETITORS
//           </text>

//           {/* ECOSYSTEM REGION - Right */}
//           <ellipse
//             cx="520"
//             cy="285"
//             rx="100"
//             ry="140"
//             fill="url(#ecosystemGlow)"
//           />
//           <ellipse
//             cx="520"
//             cy="285"
//             rx="100"
//             ry="140"
//             fill="none"
//             stroke="#4A90E2"
//             strokeWidth="0.5"
//             strokeDasharray="3,6"
//             opacity="0.4"
//           />
//           <text
//             x="555"
//             y="420"
//             fontFamily="IBM Plex Mono, monospace"
//             fontSize="9"
//             fill="#4A90E2"
//             opacity="0.7"
//             letterSpacing="0.1em"
//             transform="rotate(-90 555 420)"
//           >
//             ECOSYSTEM
//           </text>

//           {/* SAGARD PORTFOLIO REGION - Bottom Left */}
//           <ellipse cx="140" cy="380" rx="95" ry="75" fill="url(#sagardGlow)" />
//           <ellipse
//             cx="140"
//             cy="380"
//             rx="95"
//             ry="75"
//             fill="none"
//             stroke="#F59E0B"
//             strokeWidth="0.5"
//             strokeDasharray="3,6"
//             opacity="0.5"
//           />
//           <text
//             x="75"
//             y="445"
//             fontFamily="IBM Plex Mono, monospace"
//             fontSize="9"
//             fill="#F59E0B"
//             opacity="0.7"
//             letterSpacing="0.1em"
//           >
//             SAGARD PORTFOLIO
//           </text>

//           {/* TARGET REGION - Center */}
//           <circle cx="320" cy="250" r="85" fill="url(#targetGlow)" />
//           <circle
//             cx="320"
//             cy="250"
//             r="85"
//             fill="none"
//             stroke="#F59E0B"
//             strokeWidth="0.5"
//             opacity="0.3"
//           />

//           {/* Connection lines - curved paths for elegance */}
//           <path
//             d="M 320 210 Q 280 150 205 115"
//             stroke="#2A2E38"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.6"
//           />
//           <path
//             d="M 320 210 Q 350 150 395 115"
//             stroke="#2A2E38"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.6"
//           />
//           <path
//             d="M 320 210 Q 320 140 300 95"
//             stroke="#2A2E38"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.6"
//           />
//           <path
//             d="M 360 260 Q 430 260 490 245"
//             stroke="#2A2E38"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.6"
//           />
//           <path
//             d="M 350 290 Q 420 330 480 355"
//             stroke="#2A2E38"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.6"
//           />
//           <path
//             d="M 280 280 Q 220 330 170 360"
//             stroke="#F59E0B"
//             strokeWidth="1"
//             fill="none"
//             opacity="0.4"
//           />

//           {/* Subtle animated pulse rings around target */}
//           <circle
//             cx="320"
//             cy="250"
//             r="55"
//             fill="none"
//             stroke="#F59E0B"
//             strokeWidth="0.5"
//             opacity="0.15"
//           >
//             <animate
//               attributeName="r"
//               values="55;70;55"
//               dur="4s"
//               repeatCount="indefinite"
//             />
//             <animate
//               attributeName="opacity"
//               values="0.15;0.05;0.15"
//               dur="4s"
//               repeatCount="indefinite"
//             />
//           </circle>

//           {/* TARGET NODE - Center */}
//           <circle cx="320" cy="250" r="42" fill="#0F0D08" />
//           <circle
//             cx="320"
//             cy="250"
//             r="42"
//             fill="none"
//             stroke="#F59E0B"
//             strokeWidth="2"
//           />
//           <circle
//             cx="320"
//             cy="250"
//             r="48"
//             fill="none"
//             stroke="#F59E0B"
//             strokeWidth="0.5"
//             opacity="0.3"
//           />
//           <text
//             x="320"
//             y="246"
//             textAnchor="middle"
//             fontFamily="IBM Plex Mono, monospace"
//             fontSize="11"
//             fontWeight="600"
//             fill="#F59E0B"
//           >
//             {companyName.split(" ")[0] || companyName}
//           </text>
//           {companyName.split(" ").length > 1 && (
//             <text
//               x="320"
//               y="261"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="11"
//               fontWeight="600"
//               fill="#F59E0B"
//             >
//               {companyName.split(" ")[1] || ""}
//             </text>
//           )}
//           <text
//             x="320"
//             y="278"
//             textAnchor="middle"
//             fontFamily="IBM Plex Mono, monospace"
//             fontSize="7"
//             fill="#F59E0B"
//             opacity="0.6"
//           >
//             TARGET
//           </text>

//           {/* COMPETITOR NODES */}
//           <g className="competitor-node">
//             <circle cx="205" cy="100" r="28" fill="#13151A" />
//             <circle
//               cx="205"
//               cy="100"
//               r="28"
//               fill="none"
//               stroke="#E05252"
//               strokeWidth="1.5"
//             />
//             <text
//               x="205"
//               y="97"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#E05252"
//             >
//               Questrade
//             </text>
//             <text
//               x="205"
//               y="109"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="7"
//               fill="#E05252"
//               opacity="0.5"
//             >
//               Direct
//             </text>
//           </g>

//           <g className="competitor-node">
//             <circle cx="395" cy="100" r="28" fill="#13151A" />
//             <circle
//               cx="395"
//               cy="100"
//               r="28"
//               fill="none"
//               stroke="#E05252"
//               strokeWidth="1.5"
//             />
//             <text
//               x="395"
//               y="97"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#E05252"
//             >
//               Moka
//             </text>
//             <text
//               x="395"
//               y="109"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="7"
//               fill="#E05252"
//               opacity="0.5"
//             >
//               Micro-invest
//             </text>
//           </g>

//           <g className="competitor-node">
//             <circle cx="300" cy="65" r="26" fill="#13151A" />
//             <circle
//               cx="300"
//               cy="65"
//               r="26"
//               fill="none"
//               stroke="#E05252"
//               strokeWidth="1.5"
//             />
//             <text
//               x="300"
//               y="62"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#E05252"
//             >
//               Robinhood
//             </text>
//             <text
//               x="300"
//               y="74"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="7"
//               fill="#E05252"
//               opacity="0.5"
//             >
//               US Market
//             </text>
//           </g>

//           {/* ECOSYSTEM NODES */}
//           <g className="ecosystem-node">
//             <circle cx="505" cy="225" r="28" fill="#13151A" />
//             <circle
//               cx="505"
//               cy="225"
//               r="28"
//               fill="none"
//               stroke="#4A90E2"
//               strokeWidth="1.5"
//             />
//             <text
//               x="505"
//               y="222"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               Nest
//             </text>
//             <text
//               x="505"
//               y="234"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               Wealth
//             </text>
//           </g>

//           <g className="ecosystem-node">
//             <circle cx="495" cy="335" r="28" fill="#13151A" />
//             <circle
//               cx="495"
//               cy="335"
//               r="28"
//               fill="none"
//               stroke="#4A90E2"
//               strokeWidth="1.5"
//             />
//             <text
//               x="495"
//               y="332"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               Share
//             </text>
//             <text
//               x="495"
//               y="344"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               works
//             </text>
//           </g>

//           <g className="ecosystem-node">
//             <circle cx="545" cy="280" r="24" fill="#13151A" />
//             <circle
//               cx="545"
//               cy="280"
//               r="24"
//               fill="none"
//               stroke="#4A90E2"
//               strokeWidth="1.5"
//             />
//             <text
//               x="545"
//               y="277"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="8"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               Stripe
//             </text>
//             <text
//               x="545"
//               y="288"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="8"
//               fontWeight="500"
//               fill="#4A90E2"
//             >
//               Infra
//             </text>
//           </g>

//           {/* SAGARD PORTFOLIO NODE */}
//           <g className="sagard-node">
//             <circle cx="155" cy="365" r="32" fill="#0F0D08" />
//             <circle
//               cx="155"
//               cy="365"
//               r="32"
//               fill="none"
//               stroke="#F59E0B"
//               strokeWidth="1.5"
//               strokeDasharray="5,3"
//             />
//             <circle
//               cx="155"
//               cy="365"
//               r="40"
//               fill="none"
//               stroke="#F59E0B"
//               strokeWidth="0.5"
//               strokeDasharray="2,4"
//               opacity="0.4"
//             />
//             <text
//               x="155"
//               y="360"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#F59E0B"
//             >
//               Sagard
//             </text>
//             <text
//               x="155"
//               y="373"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="9"
//               fontWeight="500"
//               fill="#F59E0B"
//             >
//               Wealth
//             </text>
//             <text
//               x="155"
//               y="388"
//               textAnchor="middle"
//               fontFamily="IBM Plex Mono, monospace"
//               fontSize="6"
//               fill="#F59E0B"
//               opacity="0.6"
//             >
//               SYNERGY
//             </text>
//           </g>

//           {/* Connection dots along paths */}
//           <circle cx="260" cy="165" r="2" fill="#2A2E38" />
//           <circle cx="360" cy="165" r="2" fill="#2A2E38" />
//           <circle cx="420" cy="255" r="2" fill="#2A2E38" />
//           <circle cx="420" cy="320" r="2" fill="#2A2E38" />
//           <circle cx="225" cy="310" r="2" fill="#F59E0B" opacity="0.5" />
//         </svg>
//       </div>
//     </div>
//   );
// }


"use client";

import { EcosystemNode } from "@/types/report";

// ── Colour + layout config per node type ────────────────────
const NODE_STYLE: Record<EcosystemNode["type"], { stroke: string; text: string; fill: string }> = {
  target:     { stroke: "#F59E0B", text: "#F59E0B", fill: "#0F0D08" },
  competitor: { stroke: "#E05252", text: "#E05252", fill: "#13151A" },
  ecosystem:  { stroke: "#4A90E2", text: "#4A90E2", fill: "#13151A" },
  sagard:     { stroke: "#F59E0B", text: "#F59E0B", fill: "#0F0D08" },
};

// ── Fixed positions per node type ────────────────────────────
// Target always centre. Competitors top arc. Ecosystem right.
// Sagard bottom-left. Positions are indexed within each group.
const POSITIONS: Record<EcosystemNode["type"], { cx: number; cy: number }[]> = {
  target:     [{ cx: 320, cy: 250 }],
  competitor: [
    { cx: 205, cy: 95  },
    { cx: 300, cy: 65  },
    { cx: 395, cy: 95  },
    { cx: 155, cy: 130 },
    { cx: 445, cy: 130 },
  ],
  ecosystem:  [
    { cx: 505, cy: 220 },
    { cx: 545, cy: 280 },
    { cx: 495, cy: 340 },
    { cx: 510, cy: 160 },
  ],
  sagard:     [{ cx: 155, cy: 365 }],
};

// ── Split a long name across two SVG text lines ──────────────
function splitName(name: string): [string, string] {
  const words = name.split(" ");
  if (words.length === 1) return [name, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export default function EcosystemMap({ nodes }: { nodes: EcosystemNode[] }) {
  // Separate nodes by type, keep original order within each group
  const byType = (type: EcosystemNode["type"]) =>
    nodes.filter((n) => n.type === type);

  const target     = byType("target");
  const competitors = byType("competitor");
  const ecosystem  = byType("ecosystem");
  const sagard     = byType("sagard");

  // Assign positions — zip node list with position list, cap at available slots
  const placed = [
    ...target.slice(0, 1).map((n, i) => ({ ...n, ...POSITIONS.target[i] })),
    ...competitors.slice(0, 5).map((n, i) => ({ ...n, ...POSITIONS.competitor[i] })),
    ...ecosystem.slice(0, 4).map((n, i) => ({ ...n, ...POSITIONS.ecosystem[i] })),
    ...sagard.slice(0, 1).map((n, i) => ({ ...n, ...POSITIONS.sagard[i] })),
  ];

  const targetNode = placed.find((n) => n.type === "target");

  return (
    <div className="flex flex-col bg-[var(--bg)] h-full">
      {/* Header */}
      <div className="flex items-center py-2.5 px-[18px] border-b border-[var(--border)]">
        <div className="text-[10px] text-[var(--text4)] tracking-[0.12em] font-mono">
          ECOSYSTEM MAP
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          viewBox="0 0 640 480"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8/12"
        >
          <defs>
            <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="70%"  stopColor="#F59E0B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="competitorGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E05252" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#E05252" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ecosystemGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#4A90E2" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4A90E2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sagardGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A1D24" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

          {/* Region glows */}
          <ellipse cx="300" cy="95"  rx="200" ry="85"  fill="url(#competitorGlow)" />
          <ellipse cx="300" cy="95"  rx="200" ry="85"  fill="none" stroke="#E05252" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.4" />
          <text x="135" y="45" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#E05252" opacity="0.7" letterSpacing="0.1em">COMPETITORS</text>

          <ellipse cx="520" cy="270" rx="100" ry="150" fill="url(#ecosystemGlow)" />
          <ellipse cx="520" cy="270" rx="100" ry="150" fill="none" stroke="#4A90E2" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.4" />
          <text x="555" y="420" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#4A90E2" opacity="0.7" letterSpacing="0.1em" transform="rotate(-90 555 420)">ECOSYSTEM</text>

          <ellipse cx="140" cy="375" rx="95" ry="75" fill="url(#sagardGlow)" />
          <ellipse cx="140" cy="375" rx="95" ry="75" fill="none" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.5" />
          <text x="75" y="445" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#F59E0B" opacity="0.7" letterSpacing="0.1em">SAGARD PORTFOLIO</text>

          <circle cx="320" cy="250" r="85" fill="url(#targetGlow)" />

          {/* Connection lines from target to each non-target node */}
          {targetNode && placed
            .filter((n) => n.type !== "target")
            .map((n, i) => (
              <line
                key={i}
                x1={targetNode.cx} y1={targetNode.cy}
                x2={n.cx}          y2={n.cy}
                stroke={n.type === "sagard" ? "#F59E0B" : "#2A2E38"}
                strokeWidth="1"
                opacity={n.type === "sagard" ? 0.4 : 0.6}
              />
            ))}

          {/* Pulse ring on target */}
          <circle cx="320" cy="250" r="55" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.15">
            <animate attributeName="r"       values="55;70;55" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.05;0.15" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Render all nodes */}
          {placed.map((node, i) => {
            const style  = NODE_STYLE[node.type];
            const radius = node.type === "target" ? 42 : node.type === "sagard" ? 32 : 28;
            const [line1, line2] = splitName(node.name);
            const hasTwo = line2.length > 0;
            const textY  = hasTwo ? node.cy - 7 : node.cy + 4;

            return (
              <g key={i}>
                <circle cx={node.cx} cy={node.cy} r={radius} fill={style.fill} />
                <circle cx={node.cx} cy={node.cy} r={radius} fill="none" stroke={style.stroke} strokeWidth={node.type === "target" ? 2 : 1.5} strokeDasharray={node.type === "sagard" ? "5,3" : undefined} />

                {/* Outer ring for target + sagard */}
                {(node.type === "target" || node.type === "sagard") && (
                  <circle cx={node.cx} cy={node.cy} r={radius + 6} fill="none" stroke={style.stroke} strokeWidth="0.5" opacity="0.3" strokeDasharray={node.type === "sagard" ? "2,4" : undefined} />
                )}

                <text x={node.cx} y={textY} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={node.type === "target" ? 11 : 9} fontWeight="600" fill={style.text}>
                  {line1}
                </text>
                {hasTwo && (
                  <text x={node.cx} y={textY + 13} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={node.type === "target" ? 11 : 9} fontWeight="600" fill={style.text}>
                    {line2}
                  </text>
                )}

                {/* Type label under node */}
                <text x={node.cx} y={node.cy + radius + 12} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill={style.text} opacity="0.6">
                  {node.type === "sagard" ? "SAGARD" : node.type === "target" ? "TARGET" : node.type.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}