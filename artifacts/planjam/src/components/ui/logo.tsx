import { Zap } from 'lucide-react';
import { Link } from 'wouter';

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2" data-testid="link-home-logo">
      <span className="grid h-9 w-9 rotate-[-7deg] place-items-center rounded-[12px] bg-[#27304C] text-[#FFE48B] shadow-[3px_3px_0_#F26F52] transition-transform group-hover:rotate-3">
        <Zap size={19} strokeWidth={3} />
      </span>
      <span className="font-display text-xl font-bold tracking-[-0.06em] text-[#27304C]">planjam</span>
    </Link>
  );
}
