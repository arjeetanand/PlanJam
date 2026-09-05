import { useParams } from 'wouter';
import { useGetRoomState, getGetRoomStateQueryKey } from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { Shell } from '@/components/layout/shell';
import { RefreshCw } from 'lucide-react';

import { JoinRoom } from '@/components/room/join-room';
import { PreferencesPhase } from '@/components/room/preferences-phase';
import { ShortlistPhase } from '@/components/room/shortlist-phase';
import { VotingPhase } from '@/components/room/voting-phase';
import { FinalPhase } from '@/components/room/final-phase';

export function RoomContainer() {
  const { slug } = useParams<{ slug: string }>();
  
  const headers = slug ? getAuthHeaders(slug) : {};

  const { data: room, error, isLoading } = useGetRoomState(slug!, {
    query: {
      refetchInterval: 1500, // Poll every 1.5s
      retry: false,
      queryKey: getGetRoomStateQueryKey(slug!)
    },
    request: { headers }
  });

  if (isLoading) {
    return (
      <Shell>
        <main className="safe-page flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md rounded-3xl border border-[#D9D7D0] bg-[#FFFDF5]/75 p-7" data-testid="status-room-loading">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#E8E3D2]" />
            <div className="mt-4 h-8 w-3/4 animate-pulse rounded-xl bg-[#E8E3D2]" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#E8E3D2]" />
          </div>
        </main>
      </Shell>
    );
  }

  if (error || !room) {
    const isExpired = error?.response?.status === 410;
    const isNotFound = error?.response?.status === 404;
    return (
      <Shell>
        <main className="safe-page flex flex-1 items-center justify-center py-12">
          <div className="ink-card w-full max-w-md rounded-3xl p-7 text-center">
            <h1 className="font-display text-2xl font-bold text-[#27304C]">
              {isExpired ? 'This room has expired' : isNotFound ? 'Room not found' : 'Something went wrong'}
            </h1>
            <p className="mt-3 text-[#6A6E80]" data-testid="status-room-error">
              {isExpired ? 'Plans only stick around for a little while.' : isNotFound ? 'Check the link and try again.' : 'Try refreshing the page.'}
            </p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#27304C] px-5 py-3 text-sm font-bold text-[#FFF7E8] shadow-[0_4px_0_#11182D]" data-testid="button-retry-room">
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        </main>
      </Shell>
    );
  }

  // If viewer isn't joined, show join screen
  if (!room.viewerParticipantId) {
    return <JoinRoom room={room} />;
  }

  switch (room.phase) {
    case 'preferences': return <PreferencesPhase room={room} />;
    case 'shortlist': return <ShortlistPhase room={room} />;
    case 'voting': return <VotingPhase room={room} />;
    case 'final': return <FinalPhase room={room} />;
    default: return null;
  }
}
