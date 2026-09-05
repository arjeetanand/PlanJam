import { useState, type FormEvent } from 'react';
import { useJoinRoom, type RoomState, getGetRoomStateQueryKey } from '@workspace/api-client-react';
import { saveTokens, getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { Shell } from '@/components/layout/shell';
import { Button } from '@/components/ui/app-button';
import { ArrowRight, Users } from 'lucide-react';
import { useAppAuth } from '@/lib/auth';

export function JoinRoom({ room }: { room: RoomState }) {
  const [name, setName] = useState('');
  const { isSignedIn, user } = useAppAuth();
  const joinRoom = useJoinRoom({ request: { headers: getAuthHeaders(room.slug) } });

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (isSignedIn && user?.firstName ? user.firstName : 'Friend');
    joinRoom.mutate({ slug: room.slug, data: { name: finalName } }, {
      onSuccess: (data) => {
        saveTokens(room.slug, data.participantToken, undefined);
        queryClient.invalidateQueries({ queryKey: getGetRoomStateQueryKey(room.slug) });
      },
    });
  };

  const isFull = room.participants.length >= room.capacity;
  const isClosed = room.phase !== 'preferences';
  const cannotJoin = isFull || isClosed;

  return (
    <Shell>
      <main className="safe-page page-in mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8 sm:py-12">
        <div className="ink-card mb-8 rounded-3xl bg-[#FFF7E8] p-5 sm:p-8">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#F26F52]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F26F52]" />
            You're invited
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-.04em] text-[#27304C]">
            Join the plan
          </h1>
          
          <div className="my-6 flex flex-wrap gap-4 text-sm font-semibold text-[#6A6E80]">
            <span className="flex items-center gap-1.5 rounded-full border border-[#D9D7D0] bg-[#FFFDF5] px-3 py-1.5">
               <Users size={16} className="text-[#37A28C]" /> <span data-testid="room-join-capacity">{room.participants.length}/{room.capacity} joined</span>
            </span>
            {room.participants.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#D9D7D0] bg-[#FFFDF5] px-3 py-1.5">
                 Host: <strong className="text-[#27304C]" data-testid="text-room-host">{room.participants[0].name}</strong>
              </span>
            )}
          </div>

          {cannotJoin ? (
            <div className="rounded-2xl border border-[#D9D7D0] bg-[#F0EDE1] p-4 text-center text-sm font-medium text-[#6A6E80]">
              {isFull ? 'This room is full.' : 'Voting has already started.'}
            </div>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="guest-name" className="mb-1.5 block text-xs font-bold text-[#27304C]">Your name</label>
                <input 
                  id="guest-name"
                  type="text" 
                  placeholder="What do they call you?" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={!isSignedIn}
                  className="w-full rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] px-4 py-3 text-base font-bold text-[#27304C] outline-none focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20"
                  data-testid="input-join-name"
                />
              </div>
              <Button type="submit" disabled={joinRoom.isPending} testId="button-join-room" className="w-full py-3.5">
                {joinRoom.isPending ? 'Joining...' : 'Jump in'} <ArrowRight size={16} />
              </Button>
            </form>
          )}

          {joinRoom.isError && (
            <p className="mt-4 rounded-xl border border-[#F1B1A6] bg-[#FFD9D3]/70 px-3 py-2 text-center text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-join-error">
              {(joinRoom.error as any)?.response?.data?.error || 'Failed to join.'}
            </p>
          )}
        </div>
      </main>
    </Shell>
  );
}
