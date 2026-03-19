"use client";

import { EcosystemNode } from "@/types/report";
import { useMemo } from "react";

// Approximate rendered character width at a given font size (monospace, roughly)
// Using ~0.6 * fontSize as a safe estimate for most characters
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.62;
}

function splitName(name: string, maxCharsPerLine: number = 12): string[] {
  const words = name.split(" ");
  if (words.length === 1 && name.length <= maxCharsPerLine) return [name];

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : [name];
}

// Given a name, font size, and padding, compute the minimum circle diameter
// that keeps all text inside the circle.
// For a circle of radius r, text at line i (offset dy from center) must satisfy:
//   halfWidth² + dy² ≤ r²  →  r ≥ sqrt(halfWidth² + dy²)
function minCircleDiameter(
  name: string,
  fontSize: number,
  hPad: number = 12,
  vPad: number = 10,
): number {
  const lines = splitName(name, 12);
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;

  let maxRequired = 0;
  lines.forEach((line, i) => {
    const textW = estimateTextWidth(line, fontSize) + hPad * 2;
    const halfW = textW / 2;
    // Vertical offset of this line's center from the block center
    const blockTop = -totalHeight / 2;
    const lineCenterY = blockTop + (i + 0.5) * lineHeight;
    // Also account for top/bottom padding
    const topEdgeY = lineCenterY - fontSize / 2 - vPad;
    const botEdgeY = lineCenterY + fontSize / 2 + vPad;

    // The circle must contain both corners of this line's text bbox
    const corners = [
      { x: halfW, y: Math.abs(topEdgeY) },
      { x: halfW, y: Math.abs(botEdgeY) },
    ];
    for (const { x, y } of corners) {
      const r = Math.sqrt(x * x + y * y);
      maxRequired = Math.max(maxRequired, r * 2);
    }
  });

  return maxRequired;
}

interface EcosystemMapProps {
  nodes: EcosystemNode[];
  companyName: string;
}

export default function EcosystemMap({
  companyName,
  nodes,
}: EcosystemMapProps) {
  const competitors = nodes.filter((n) => n.type === "competitor");
  const ecosystem = nodes.filter((n) => n.type === "ecosystem");

  const totalCompanies = competitors.length + ecosystem.length;

  // Base font size from count
  const baseFontSize = useMemo(() => {
    if (totalCompanies <= 6) return 11;
    if (totalCompanies <= 10) return 10;
    if (totalCompanies <= 14) return 9;
    return 8;
  }, [totalCompanies]);

  // Compute per-node sizes driven by text content
  const getNodeSize = (name: string) => {
    const minDiameter = minCircleDiameter(name, baseFontSize);
    // Also enforce a count-based minimum
    const countMin =
      totalCompanies <= 6
        ? 90
        : totalCompanies <= 10
          ? 75
          : totalCompanies <= 14
            ? 60
            : 50;
    return Math.max(minDiameter, countMin);
  };

  // For layout radius, use the max node size so nodes don't overlap
  const maxNodeSize = useMemo(() => {
    const allNames = [...competitors, ...ecosystem].map((c) => c.name);
    return Math.max(...allNames.map((n) => getNodeSize(n)));
  }, [competitors, ecosystem, baseFontSize]);

  const sizing = useMemo(() => {
    const targetSize =
      totalCompanies <= 6
        ? 130
        : totalCompanies <= 10
          ? 120
          : totalCompanies <= 14
            ? 100
            : 90;
    // Radius as % of container — scale up slightly to accommodate larger nodes
    const radius = 40 + (maxNodeSize - 60) * 0.05;
    return { fontSize: baseFontSize, targetSize, radius: Math.min(radius, 46) };
  }, [totalCompanies, baseFontSize, maxNodeSize]);

  const competitorPositions = useMemo(() => {
    const count = competitors.length;
    const startAngle = 180 + 20;
    const endAngle = 360 - 20;
    const angleStep = (endAngle - startAngle) / (count - 1 || 1);
    return competitors.map((comp, i) => {
      const angle = count === 1 ? 270 : startAngle + angleStep * i;
      const radian = (angle * Math.PI) / 180;
      return {
        ...comp,
        x: 50 + sizing.radius * Math.cos(radian),
        y: 50 + sizing.radius * Math.sin(radian),
        angle,
      };
    });
  }, [competitors, sizing.radius]);

  const ecosystemPositions = useMemo(() => {
    const count = ecosystem.length;
    const startAngle = 20;
    const endAngle = 180 - 20;
    const angleStep = (endAngle - startAngle) / (count - 1 || 1);
    return ecosystem.map((eco, i) => {
      const angle = count === 1 ? 90 : startAngle + angleStep * i;
      const radian = (angle * Math.PI) / 180;
      return {
        ...eco,
        x: 50 + sizing.radius * Math.cos(radian),
        y: 50 + sizing.radius * Math.sin(radian),
        angle,
      };
    });
  }, [ecosystem, sizing.radius]);

  const targetLines = splitName(companyName, 10);

  const renderNode = (
    name: string,
    color: string,
    glowColor: string,
    x: number,
    y: number,
    key: string,
  ) => {
    const lines = splitName(name, 12);
    const nodeSize = getNodeSize(name);
    return (
      <div
        key={key}
        className="absolute flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 cursor-pointer group"
        style={{
          width: nodeSize,
          height: nodeSize,
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
          backgroundColor: "#0F1014",
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 20px ${color}15`,
        }}
      >
        {/* Inner safe-area circle guide — invisible, just constrains layout */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: nodeSize * 0.78,
            height: nodeSize * 0.78,
            overflow: "hidden",
          }}
        >
          {lines.map((line, j) => (
            <div
              key={j}
              className="font-mono font-medium leading-tight text-center w-full"
              style={{
                fontSize: sizing.fontSize,
                color,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `0 0 25px ${glowColor}` }}
        />
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#0A0B0D" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between py-2.5 px-4 border-b border-[var(--border)]">
        <div className="text-[12px] text-[var(--text4)] tracking-[0.02em] font-mono font-bold">
          ECOSYSTEM MAP
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#E05252" }}
            />
            <span className="text-[11px] tracking-[0.1em] font-normal font-mono" style={{ color: "#E05252" }}>
              COMPETITORS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#4A90E2" }}
            />
            <span className="text-[11px] tracking-[0.1em] font-normal font-mono" style={{ color: "#4A90E2" }}>
              ECOSYSTEM
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff03 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff03 1px, transparent 1px)
            `,
            backgroundSize: "30px 30px",
          }}
        />

        <div className="absolute inset-4 flex items-center justify-center">
          <div
            className="relative w-full h-full"
            style={{ maxWidth: "800px", maxHeight: "800px", aspectRatio: "1" }}
          >
            {/* SVG lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {competitorPositions.map((comp, i) => (
                <g key={`comp-line-${i}`}>
                  <line
                    x1={comp.x}
                    y1={comp.y}
                    x2="50"
                    y2="50"
                    stroke="#E05252"
                    strokeWidth="0.3"
                    strokeDasharray="1.5,1"
                    opacity="0.5"
                  />
                  <circle
                    cx={(comp.x + 50) / 2}
                    cy={(comp.y + 50) / 2}
                    r="0.6"
                    fill="#E05252"
                    opacity="0.7"
                  />
                </g>
              ))}
              {ecosystemPositions.map((eco, i) => (
                <g key={`eco-line-${i}`}>
                  <line
                    x1={eco.x}
                    y1={eco.y}
                    x2="50"
                    y2="50"
                    stroke="#4A90E2"
                    strokeWidth="0.3"
                    strokeDasharray="1.5,1"
                    opacity="0.5"
                  />
                  <circle
                    cx={(eco.x + 50) / 2}
                    cy={(eco.y + 50) / 2}
                    r="0.6"
                    fill="#4A90E2"
                    opacity="0.7"
                  />
                </g>
              ))}
              <line
                x1="50"
                y1="5"
                x2="50"
                y2="95"
                stroke="#4A90E2"
                strokeWidth="0.15"
                strokeDasharray="1,2"
                opacity="0.2"
              />
            </svg>

            {/* Competitor Nodes */}
            {competitorPositions.map((comp, i) =>
              renderNode(
                comp.name,
                "#E05252",
                "#E0525240",
                comp.x,
                comp.y,
                `comp-node-${i}`,
              ),
            )}

            {/* Ecosystem Nodes */}
            {ecosystemPositions.map((eco, i) =>
              renderNode(
                eco.name,
                "#4A90E2",
                "#4A90E240",
                eco.x,
                eco.y,
                `eco-node-${i}`,
              ),
            )}

            {/* Center Target Node */}
            <div
              className="absolute flex flex-col items-center justify-center"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: sizing.targetSize * 1.8,
                  height: sizing.targetSize * 1.8,
                  background:
                    "radial-gradient(circle, #F59E0B12 0%, #F59E0B05 40%, transparent 70%)",
                }}
              />
              <div
                className="absolute rounded-full animate-ping "
                style={{
                  width: sizing.targetSize * 1.15,
                  height: sizing.targetSize * 1.15,
                  border: "1px solid #F59E0B",
                  opacity: 0.12,
                  animationDuration: "3s",
                }}
              />
              <div
                className="absolute rounded-full "
                style={{
                  width: sizing.targetSize * 1.1,
                  height: sizing.targetSize * 1.1,
                  border: "1px solid #F59E0B30",
                }}
              />
              <div
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: sizing.targetSize,
                  height: sizing.targetSize,
                  backgroundColor: "#0A0B0D",
                  border: "2.5px solid #F59E0B",
                  boxShadow: "0 0 40px #F59E0B25, inset 0 0 30px #F59E0B08",
                }}
              >
                <div className="text-center px-2">
                  {targetLines.map((line, i) => (
                    <div
                      key={i}
                      className="font-mono font-bold leading-tight"
                      style={{
                        fontSize: sizing.fontSize + 4,
                        color: "#F59E0B",
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="absolute font-mono tracking-[0.2em] "
                style={{
                  bottom: -30,
                  fontSize: "15px",
                  color: "#F59E0B",
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  opacity: 0.5,
                }}
              >
                TARGET
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
