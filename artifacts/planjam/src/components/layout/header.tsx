import { Logo } from '../ui/logo';
import { steps } from '@/lib/constants';
import { Users } from 'lucide-react';
import { Link } from 'wouter';
import { useAppAuth } from '@/lib/auth';
import { hasClerk } from '@/lib/clerk-config';

function AccountControl() {
  const { isLoaded, isSignedIn, user, signOut } = useAppAuth();

  if (!hasClerk) {
    return null;
  }

  if (!isLoaded) {
    return <span className="hidden h-9 w-20 animate-pulse rounded-full bg-[#E8E3D2] sm:block" aria-label="Loading account" />;
  }

  if (isSignedIn) {
    const displayName = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'friend';
    return (
      <div className="flex items-center gap-2 rounded-full border border-[#D9D7D0] bg-[#FFF7E8]/80 py-1 pl-2 pr-1.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#B7DBD7] text-[10px] font-bold uppercase text-[#27304C]">
          {displayName.slice(0, 1)}
        </span>
        <span className="hidden max-w-24 truncate text-xs font-bold text-[#27304C] sm:block">{displayName}</span>
        <button
          type="button"
          onClick={() => void signOut({ redirectUrl: '/' })}
          className="rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[#6A6E80] transition-colors hover:bg-[#FFD9D3] hover:text-[#A83F31]"
          data-testid="button-sign-out"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link href="/sign-in" className="rounded-full px-2.5 py-2 text-xs font-bold text-[#6A6E80] transition-colors hover:text-[#F26F52]" data-testid="link-sign-in">
        Sign in
      </Link>
      <Link href="/sign-up" className="rounded-full bg-[#27304C] px-3.5 py-2 text-xs font-bold text-[#FFF7E8] shadow-[2px_2px_0_#F26F52] transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">
        Join the crew
      </Link>
    </div>
  );
}

export function Header({ step }: { step?: number }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo />
      <div className="flex items-center gap-3 sm:gap-5">
        {step ? (
          <div className="flex items-center gap-3" data-testid="status-progress">
            <span className="hidden font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#7C7F91] sm:block">{steps[step - 1].label}</span>
            <div className="flex gap-1.5" aria-label={`Step ${step} of 4`}>
              {steps.map((item) => (
                <span key={item.number} className={`h-1.5 w-7 overflow-hidden rounded-full transition-colors duration-300 sm:w-10 ${Number(item.number) <= step ? 'bg-[#F26F52]' : 'bg-[#DBD8CC]'}`} />
              ))}
            </div>
            <span className="font-mono text-[11px] font-medium text-[#F26F52]">{String(step).padStart(2, '0')}/04</span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 text-xs font-semibold text-[#7C7F91] sm:flex">
            <Users size={15} /> made for the group chat
          </div>
        )}
        <AccountControl />
      </div>
    </header>
  );
}
