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
    return <Shell><div className="flex-1 flex items-center justify-center"><div className="animate-pulse text-[#6A6E80] font-bold">Loading...</div></div></Shell>;
  }

  const handleStart = () => {
    createRoom.mutate({ data: { name: user?.firstName || 'Host' } }, {
      onSuccess: (data) => {
        saveTokens(data.slug, data.participantToken, data.hostToken);
        setLocation(`/room/${data.slug}`);
      }
    });
  };

  return (
    <Shell>
      <main className="page-in mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold tracking-[-.06em] text-[#27304C]">
            Welcome back, {user?.firstName || 'Friend'}.
          </h1>
          <p className="mt-2 text-[#6A6E80]">Ready to stop debating and start doing?</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border-2 border-[#27304C] bg-[#FFFDF5] p-6 shadow-[6px_6px_0_#27304C]">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]">
              <PartyPopper size={24} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold tracking-[-.04em] text-[#27304C]">Start a new plan</h2>
            <p className="mb-8 text-[#6A6E80]">Get the crew aligned in under 60 seconds.</p>
            <Button onClick={handleStart} disabled={createRoom.isPending} testId="button-portal-start">
              {createRoom.isPending ? 'Starting...' : 'Create Room'} <ArrowRight size={16} />
            </Button>
          </div>
          
          <div className="flex flex-col justify-center rounded-3xl border-2 border-[#D9D7D0] border-dashed bg-transparent p-6 text-center">
            <p className="text-sm font-semibold text-[#8A8D9B]">
              Past plans will appear here in the future.
            </p>
          </div>
        </div>
      </main>
    </Shell>
  );
}
