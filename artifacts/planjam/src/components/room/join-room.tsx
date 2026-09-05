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
        <div className="ink-card relative mb-8 overflow-hidden rounded-[28px] bg-[#FFFDF5] p-5 shadow-[5px_5px_0_#27304C] sm:rounded-[32px] sm:p-9 sm:shadow-[8px_8px_0_#27304C]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D6CDAA] bg-[#FFF1A9] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#5D5121]">
            <span className="h-2 w-2 rounded-full bg-[#F26F52] animate-pulse" />
            You're invited
          </div>
          <h1 className="font-display text-2xl font-bold tracking-[-.05em] text-[#27304C] sm:text-3xl min-[480px]:text-4xl">
            Join the crew’s plan
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6A6E80]">
            Drop your name, pick your vibe, and help the group settle on one plan in 60 seconds.
          </p>

          <div className="my-6 rounded-2xl border-2 border-[#27304C] bg-[#FFF7E8] p-4 shadow-[3px_3px_0_#FFE48B]">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#27304C]">
              <span className="flex items-center gap-1.5" data-testid="room-join-capacity">
                <Users size={16} className="text-[#37A28C]" />
                <span>{room.participants.length}/{room.capacity} joined</span>
              </span>
              {room.participants.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6A6E80]">
                  Host: <strong className="font-bold text-[#27304C] truncate max-w-[120px]" data-testid="text-room-host">{room.participants[0].name}</strong>
                </span>
              )}
            </div>
            {room.participants.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E8E3D2] pt-3">
                <span className="text-[11px] font-mono text-[#8A8D9B] mr-1">In the room:</span>
                {room.participants.map((p, i) => (
                  <span key={p.id} className="inline-flex max-w-[130px] items-center gap-1 rounded-full bg-[#FFFDF5] border border-[#D9D7D0] px-2.5 py-0.5 text-xs font-bold text-[#27304C]">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-[#F26F52]' : 'bg-[#37A28C]'}`} />
                    <span className="truncate">{p.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {cannotJoin ? (
            <div className="rounded-2xl border-2 border-[#27304C] bg-[#FFD9D3] p-5 text-center text-sm font-bold text-[#A83F31]">
              {isFull ? 'This room has reached its 10-person capacity.' : 'Voting has already started for this plan.'}
            </div>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="guest-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#27304C]">Your name</label>
                <input
                  id="guest-name"
                  type="text"
                  placeholder={isSignedIn && user?.firstName ? user.firstName : "What do your friends call you?"}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={!isSignedIn}
                  autoFocus
                  className="w-full rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5] px-4 py-3.5 text-base font-bold text-[#27304C] shadow-[3px_3px_0_#27304C] outline-none transition-all placeholder:font-medium placeholder:text-[#9B9CA6] focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20"
                  data-testid="input-join-name"
                />
              </div>
              <Button
                type="submit"
                disabled={joinRoom.isPending}
                loading={joinRoom.isPending}
                testId="button-join-room"
                className="w-full py-3.5 text-base"
              >
                {joinRoom.isPending ? 'Joining plan…' : 'Jump in'} <ArrowRight size={18} strokeWidth={2.5} />
              </Button>
            </form>
          )}

          {joinRoom.isError && (
            <p className="mt-4 rounded-xl border border-[#F1B1A6] bg-[#FFD9D3] p-3 text-center text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-join-error">
              {(joinRoom.error as any)?.data?.error || (joinRoom.error as any)?.message || 'Failed to join.'}
            </p>
          )}
        </div>
      </main>
    </Shell>
  );
}
