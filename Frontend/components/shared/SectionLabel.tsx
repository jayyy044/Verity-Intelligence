export default function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-[16px] text-[var(--text4)] tracking-[0.04em] mb-2 font-mono uppercase font-bold">
      {children}
    </div>
  );
}
