export default function FitBadge({
  level = "strong",
}: {
  level?: "strong" | "moderate" | "weak";
}) {
  const styles = {
    strong: {
      bg: "rgba(61,184,122,0.12)",
      text: "#3DB87A",
      border: "rgba(61,184,122,0.25)",
      label: "STRONG FIT",
    },
    moderate: {
      bg: "rgba(245,158,11,0.12)",
      text: "#F59E0B",
      border: "rgba(245,158,11,0.25)",
      label: "MODERATE FIT",
    },
    weak: {
      bg: "rgba(224,82,82,0.12)",
      text: "#E05252",
      border: "rgba(224,82,82,0.25)",
      label: "WEAK FIT",
    },
  };

  const style = styles[level] || styles.strong;

  return (
    <div
      className="text-[12.5px] font-medium py-1 px-3 tracking-[0.01em] font-mono font-bold"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {style.label}
    </div>
  );
}
