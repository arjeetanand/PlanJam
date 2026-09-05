import { Shell } from '@/components/layout/shell';
import { SectionTitle } from '@/components/ui/section-title';
import { Button } from '@/components/ui/app-button';
import { 
  type RoomState, 
  useUpdateRoomPhase,
  getGetRoomStateQueryKey 
} from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { mergeRoomState } from '@/lib/room-cache';
import { ArrowRight, Crown, Sparkles, Utensils, Film, Gamepad2, Sun, Waves, PartyPopper, MapPin, Star, Clock3, ExternalLink, type LucideIcon } from 'lucide-react';
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

export function ShortlistPhase({ room }: { room: RoomState }) {
  const headers = getAuthHeaders(room.slug);
  const updatePhase = useUpdateRoomPhase({ request: { headers } });

  const handleOpenVoting = () => {
    updatePhase.mutate({ slug: room.slug, data: { phase: 'voting' } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data));
      }
    });
  };

  const isHost = room.isHost;

  return (
    <Shell step={2}>
      <main className="page-in mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <section>
            <SectionTitle 
              eyebrow="02 / group sync" 
              title="Look at that overlap." 
               body="We weighted the group’s strongest signals, kept minority picks in the mix, and protected every hard no." 
            />
            <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#B7DBD7]">the overlap</p>
                  <h2 className="font-display mt-2 text-2xl font-bold tracking-[-.05em]">Good vibes ready</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]">
                  <Sparkles size={23} />
                </div>
              </div>
              <div className="mt-6">
                <Roster participants={room.participants} capacity={room.capacity} />
              </div>
            </div>
            
            {isHost ? (
              <div className="mt-8 rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5] p-5 text-center shadow-[4px_4px_0_#27304C]">
                <h3 className="mb-2 font-display text-lg font-bold text-[#27304C]">Ready to decide?</h3>
                <p className="mb-4 text-sm text-[#6A6E80]">Everyone will vote on these options.</p>
                <Button 
                  onClick={handleOpenVoting} 
                  disabled={updatePhase.isPending} 
                  variant="primary" 
                  className="w-full"
                  testId="button-open-voting"
                >
                  Open Voting <ArrowRight size={16} />
                </Button>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-5 text-center">
                <p className="text-sm font-medium text-[#6A6E80]">
                  Waiting for host ({room.participants[0]?.name}) to open voting...
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#F26F52]">the shortlist</p>
                <h2 className="font-display mt-1 text-2xl font-bold tracking-[-.05em] text-[#27304C]">Three ways to make it happen</h2>
              </div>
              <span className="hidden text-xs text-[#8A8D9B] sm:block">ranked by group match</span>
            </div>
             <div className="mb-4 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] px-4 py-3 text-xs leading-5 text-[#6A6E80]">
              <p>Ranked by majority activity, practical budget, and distance fit. Hard NOs are always excluded; a minority preference can still appear as a fair compromise.</p>
              <p className="mt-1">
              {room.venueStatus === 'nearby-results'
                ? 'Real nearby venues are mixed with curated backups when needed.'
                : room.venueStatus === 'fallback-provider-unavailable'
                  ? 'Nearby search is temporarily unavailable, so these are curated group matches.'
                  : room.venueStatus === 'fallback-no-results'
                    ? 'No suitable nearby venues were found, so these are curated group matches.'
                    : 'No room location was shared, so these are curated group matches.'}
              </p>
            </div>
            <div className="space-y-4">
              {room.shortlist.map((plan, index) => {
                const Icon = PLAN_ICONS[plan.category] || Utensils;
                const colorClass = PLAN_COLORS[plan.category] || 'bg-[#D9D7D0]';
                
                return (
                  <article key={plan.id} data-testid={`card-plan-${plan.id}`} className="group rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/85 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#27304C] hover:shadow-[4px_4px_0_#27304C] sm:p-5">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${colorClass} text-[#27304C]`}>
                          <Icon size={25} />
                        </span>
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide ${index === 0 ? 'bg-[#27304C] text-[#FFF7E8]' : 'bg-[#F0EDE1] text-[#8A8D9B]'}`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h3>
                            <p className="mt-0.5 text-sm text-[#74788A]">{plan.detail}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#DBF1E6] px-2.5 py-1 font-mono text-[11px] font-medium text-[#277865]">{plan.matchPercent}% match</span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E4E0D3]" aria-label={`${plan.matchPercent}% match`}>
                          <div className={`h-full rounded-full ${index === 0 ? 'bg-[#F26F52]' : 'bg-[#37A28C]'}`} style={{ width: `${plan.matchPercent}%` }} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {plan.reasons.map((reason) => (
                            <span key={reason} className="rounded-full bg-[#F0EDE1] px-2.5 py-1 text-[11px] font-semibold text-[#65697A]">{reason}</span>
                          ))}
                        </div>
                         {plan.venue && (
                           <div className="mt-4 rounded-xl bg-[#F0EDE1] p-3 text-xs text-[#5E6377]">
                             <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-[#F26F52]" /> {plan.venue.address}</p>
                             <div className="mt-2 flex flex-wrap items-center gap-3">
                               <span>{plan.venue.distanceMeters < 1000 ? `${plan.venue.distanceMeters} m` : `${(plan.venue.distanceMeters / 1000).toFixed(1)} km`} away</span>
                               {plan.venue.rating !== undefined && <span className="flex items-center gap-1"><Star size={13} fill="#F4B942" className="text-[#F4B942]" /> {plan.venue.rating.toFixed(1)}</span>}
                               {plan.venue.openNow !== undefined && <span className="flex items-center gap-1"><Clock3 size={13} /> {plan.venue.openNow ? 'Open now' : 'Closed now'}</span>}
                               <a href={plan.venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-bold text-[#277865] hover:underline">Maps <ExternalLink size={12} /></a>
                             </div>
                           </div>
                         )}
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#F26F52]">
                        <Crown size={14} /> strongest match
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </Shell>
  );
}
