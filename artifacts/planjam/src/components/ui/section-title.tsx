export function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mb-8 min-w-0">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.17em] text-[#F26F52]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F26F52]" /> <span>{eyebrow}</span></div>
      <h1 className="font-display text-[clamp(2.4rem,7vw,3.7rem)] font-bold leading-[.95] tracking-[-.065em] text-[#27304C]">{title}</h1>
      {body && <p className="mt-4 max-w-lg text-[.98rem] leading-6 text-[#6A6E80]">{body}</p>}
    </div>
  );
}
