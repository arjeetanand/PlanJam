import { useParams } from 'wouter';
import { useGetRoomState, getGetRoomStateQueryKey } from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { Shell } from '@/components/layout/shell';

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
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-pulse text-sm font-bold text-[#6A6E80]">Loading room...</div>
        </div>
      </Shell>
    );
  }

  if (error || !room) {
    const isExpired = error?.response?.status === 410;
    const isNotFound = error?.response?.status === 404;
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center p-5">
          <div className="rounded-3xl border-2 border-[#27304C] bg-[#FFFDF5] p-8 text-center shadow-[6px_6px_0_#27304C]">
            <h1 className="font-display text-2xl font-bold text-[#27304C]">
              {isExpired ? 'This room has expired' : isNotFound ? 'Room not found' : 'Something went wrong'}
            </h1>
            <p className="mt-2 text-[#6A6E80]">
              {isExpired ? 'Plans only stick around for a little while.' : isNotFound ? 'Check the link and try again.' : 'Try refreshing the page.'}
            </p>
          </div>
        </div>
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
