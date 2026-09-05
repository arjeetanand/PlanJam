import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="app-shell flex min-h-[100dvh] w-full items-center justify-center p-5">
      <div className="ink-card w-full max-w-md rounded-[2rem] p-8 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#F26F52]">wrong turn</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.07em] text-[#27304C]">404</h1>
        <p className="mt-3 text-[#6A6E80]">That plan wandered off. Let’s get you back to the start.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#27304C] px-5 py-3 text-sm font-bold text-[#FFF7E8]" data-testid="link-not-found-home">
          <ArrowLeft size={16} /> Back home
        </Link>
      </div>
    </main>
  );
}
