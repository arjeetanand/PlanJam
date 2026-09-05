export function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.17em] text-[#F26F52]"><span className="h-1.5 w-1.5 rounded-full bg-[#F26F52]" /> {eyebrow}</div>
      <h1 className="font-display text-4xl font-bold leading-[.95] tracking-[-.065em] text-[#27304C] sm:text-5xl">{title}</h1>
      {body && <p className="mt-3 max-w-lg leading-6 text-[#6A6E80]">{body}</p>}
    </div>
  );
}
