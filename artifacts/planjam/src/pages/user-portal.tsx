import { useEffect } from 'react';
import { Shell } from '@/components/layout/shell';
import { Button } from '@/components/ui/app-button';
import { useLocation } from 'wouter';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useCreateRoom } from '@workspace/api-client-react';
import { saveTokens } from '@/lib/storage';
import { useAppAuth } from '@/lib/auth';

export function UserPortal() {
  const { user, isLoaded, isSignedIn } = useAppAuth();
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/sign-in');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) {
    return <Shell><main className="safe-page flex flex-1 items-center justify-center py-12"><div className="w-full max-w-md animate-pulse rounded-3xl border border-[#D9D7D0] bg-[#FFFDF5]/70 p-8 text-center text-sm font-bold text-[#6A6E80]" data-testid="status-portal-loading">Loading your plans…</div></main></Shell>;
  }

  const handleStart = () => {
    createRoom.mutate({ data: { name: user?.firstName || 'Host' } }, {
      onSuccess: (data) => {
        saveTokens(data.slug, data.participantToken, data.hostToken);
        setLocation(`/room/${data.slug}`);
      },
    });
  };

  return (
    <Shell>
        <main className="safe-page page-in mx-auto max-w-4xl py-8 sm:py-12">
        <div className="mb-12">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#F26F52]">your planning desk</p>
          <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,4rem)] font-bold leading-[.94] tracking-[-.07em] text-[#27304C]">
            Welcome back, {user?.firstName || 'Friend'}.
          </h1>
          <p className="mt-2 text-[#6A6E80]">Ready to stop debating and start doing?</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(240px,.9fr)]">
          <div className="ink-card rounded-3xl p-6 sm:p-7">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]">
              <PartyPopper size={24} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold tracking-[-.04em] text-[#27304C]">Start a new plan</h2>
            <p className="mb-8 text-[#6A6E80]">Get the crew aligned in under 60 seconds.</p>
            <Button onClick={handleStart} disabled={createRoom.isPending} testId="button-portal-start" className="w-full sm:w-auto">
              {createRoom.isPending ? 'Starting...' : 'Create Room'} <ArrowRight size={16} />
            </Button>
            {createRoom.isError && <p className="mt-4 rounded-xl border border-[#F1B1A6] bg-[#FFD9D3]/70 px-3 py-2 text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-portal-error">We couldn't create a room. Please try again.</p>}
          </div>
          
          <div className="flex min-h-44 flex-col justify-center rounded-3xl border border-[#D9D7D0] border-dashed bg-[#FFF7E8]/40 p-6 text-center sm:min-h-0">
            <p className="text-sm font-semibold text-[#8A8D9B]">
              Past plans will appear here in the future.
            </p>
          </div>
        </div>
      </main>
    </Shell>
  );
}
