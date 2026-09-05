import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/shell';
import { SectionTitle } from '@/components/ui/section-title';
import { Button } from '@/components/ui/app-button';
import { 
  type RoomState, 
  useUpdateRoomVotes,
  useUpdateRoomPhase,
  getGetRoomStateQueryKey 
} from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { mergeRoomState } from '@/lib/room-cache';
import { ArrowRight, ThumbsUp, Check, ThumbsDown, Utensils, Film, Gamepad2, Sun, Waves, PartyPopper, MapPin, ExternalLink, type LucideIcon } from 'lucide-react';
import { Roster } from './roster';

const PLAN_ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  movie: Film,
  games: Gamepad2,
  outdoors: Sun,
  chill: Waves,
  party: PartyPopper,
};

const PLAN_COLORS: Record<string, string> = {
  food: 'bg-[#FFB59F]',
  movie: 'bg-[#B7DBD7]',
  games: 'bg-[#FFE48B]',
  outdoors: 'bg-[#FFF1A9]',
  chill: 'bg-[#E0E1FF]',
  party: 'bg-[#FFD9D3]',
};

export function VotingPhase({ room }: { room: RoomState }) {
  const headers = getAuthHeaders(room.slug);
  const updateVotes = useUpdateRoomVotes({ request: { headers } });
  const updatePhase = useUpdateRoomPhase({ request: { headers } });

  const [votes, setVotes] = useState<Record<string, 'love' | 'works' | 'no'>>(room.viewerVotes || {});
  const [voteError, setVoteError] = useState(false);

  const serverVotesStr = JSON.stringify(room.viewerVotes);
  
  useEffect(() => {
    if (room.viewerVotes) {
      setVotes(room.viewerVotes);
    }
  }, [serverVotesStr]);

  const handleVote = (planId: string, value: 'love' | 'works' | 'no') => {
    const newVotes = { ...votes, [planId]: value };
    setVotes(newVotes);
    setVoteError(false);
    
    // Auto-save if all plans are voted on
    if (Object.keys(newVotes).length === room.shortlist.length) {
      updateVotes.mutate({ slug: room.slug, data: { votes: newVotes } }, {
        onSuccess: (data) => queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data)),
        onError: () => setVoteError(true),
      });
    }
  };

  const handleShowFinal = () => {
    updatePhase.mutate({ slug: room.slug, data: { phase: 'final' } }, {
      onSuccess: (data) => queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data))
    });
  };

  const isHost = room.isHost;
  const votedCount = Object.keys(votes).length;
  const allVoted = room.participants.every(p => p.votesSubmitted);
  const isComplete = votedCount === room.shortlist.length;

  const voteLabels = [
    { value: 'love' as const, label: 'Love it', icon: ThumbsUp },
    { value: 'works' as const, label: 'Works', icon: Check },
    { value: 'no' as const, label: 'No', icon: ThumbsDown },
  ];

  return (
    <Shell step={3}>
      <main className="safe-page page-in mx-auto max-w-4xl pb-16 pt-6 sm:pb-20 sm:pt-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionTitle 
            eyebrow="03 / the vote" 
            title="Make your call." 
            body="Rate each option. We'll add it all up and crown the winner." 
          />
          <span className="hidden shrink-0 rounded-full border border-[#D9D7D0] bg-[#FFF7E8]/70 px-3 py-2 font-mono text-[10px] font-bold text-[#F26F52] sm:inline-flex">
            {votedCount}/{room.shortlist.length} rated
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:items-start">
          <div className="space-y-6">
            {room.shortlist.map((plan) => {
              const Icon = PLAN_ICONS[plan.category] || Utensils;
              const colorClass = PLAN_COLORS[plan.category] || 'bg-[#D9D7D0]';
              const myVote = votes[plan.id];

              return (
                <article key={plan.id} data-testid={`vote-plan-${plan.id}`} className="rounded-2xl border-2 border-[#D9D7D0] bg-[#FFFDF5] p-4 shadow-sm transition-colors hover:border-[#A8A8B1] sm:p-5">
                  <div className="mb-5 flex items-start gap-4">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${colorClass} text-[#27304C]`}>
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-bold tracking-[-.04em] text-[#27304C]">{plan.name}</h3>
                      <p className="mt-1 text-sm text-[#6A6E80]">{plan.detail}</p>
                    </div>
                  </div>
                     {plan.venue && (
                       <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-[#F0EDE1] p-3 text-xs text-[#5E6377]">
                          <span className="min-w-0 flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-[#F26F52]" /> <span className="min-w-0 break-words">{plan.venue.address} · {plan.venue.distanceMeters < 1000 ? `${plan.venue.distanceMeters} m` : `${(plan.venue.distanceMeters / 1000).toFixed(1)} km`}</span></span>
                          <a href={plan.venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-1 font-bold text-[#277865]" data-testid={`link-vote-map-${plan.id}`}>Maps <ExternalLink size={12} /></a>
                       </div>
                     )}
                  <div className="grid grid-cols-3 gap-2">
                    {voteLabels.map(({ value, label, icon: VoteIcon }) => {
                      const selected = myVote === value;
                      return (
                        <button
                           key={value}
                           type="button"
                          onClick={() => handleVote(plan.id, value)}
                           disabled={updateVotes.isPending}
                           aria-pressed={selected}
                          data-testid={`vote-${value}-${plan.id}`}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                            selected 
                              ? value === 'love' ? 'border-[#37A28C] bg-[#DBF1E6] text-[#1F655B]' 
                                : value === 'works' ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8]' 
                                : 'border-[#A83F31] bg-[#FFD9D3] text-[#7C362C]'
                              : 'border-[#E8E3D2] bg-[#FFF7E8]/50 text-[#8A8D9B] hover:border-[#B8BBC8] hover:bg-[#FFFDF5]'
                          }`}
                        >
                          <VoteIcon size={18} strokeWidth={selected ? 3 : 2} />
                          <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="space-y-6">
            <Roster participants={room.participants} capacity={room.capacity} />
            
            <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]">
              <h3 className="mb-2 font-display text-lg font-bold text-[#FFF7E8]">Status</h3>
              {isHost ? (
                <>
                  <p className="mb-4 text-sm text-[#B8BBC8]">Wait for everyone to finish voting, then reveal the winner.</p>
                  <Button 
                    onClick={handleShowFinal} 
                    disabled={!allVoted || updatePhase.isPending} 
                    variant="primary" 
                    className="w-full"
                    testId="button-show-results"
                  >
                    Show Result <ArrowRight size={16} />
                  </Button>
                  {!allVoted && <p className="mt-3 text-center text-[11px] font-mono text-[#F26F52]">waiting for votes</p>}
                   {updatePhase.isError && <p className="mt-3 text-center text-xs font-bold text-[#FFB59F]" role="alert" data-testid="status-results-error">Couldn’t reveal the result. Try again.</p>}
                </>
              ) : (
                <p className="text-sm text-[#B8BBC8]">
                  {isComplete 
                    ? `You're all set! Waiting for ${room.participants[0]?.name} to reveal the winner.`
                    : "Rate every option to lock in your votes."}
                </p>
              )}
            </div>
            {voteError && <p className="rounded-xl border border-[#F1B1A6] bg-[#FFD9D3]/70 px-3 py-2 text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-vote-error">Votes didn’t save. Try rating the last option again.</p>}
          </aside>
        </div>
      </main>
    </Shell>
  );
}
