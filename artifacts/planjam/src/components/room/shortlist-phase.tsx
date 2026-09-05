import { Shell } from '@/components/layout/shell';
import { SectionTitle } from '@/components/ui/section-title';
import { useEffect, useRef } from 'react';
import {
  type RoomState,
  useUpdateRoomPhase,
  getGetRoomStateQueryKey
} from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { mergeRoomState } from '@/lib/room-cache';
import { Crown, Sparkles, Utensils, Film, Gamepad2, Sun, Waves, PartyPopper, MapPin, Star, Clock3, ExternalLink, LoaderCircle, type LucideIcon } from 'lucide-react';
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
  const requestedRef = useRef(false);

  useEffect(() => {
    const attempt = () => {
      if (requestedRef.current || room.phase !== 'shortlist') return;
      requestedRef.current = true;
      updatePhase.mutate({ slug: room.slug, data: { phase: 'voting' } }, {
        onSuccess: (data) => queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data)),
        onError: () => { requestedRef.current = false; },
      });
    };
    const timeout = window.setTimeout(attempt, 1800);
    const retry = window.setInterval(attempt, 4500);
    return () => { window.clearTimeout(timeout); window.clearInterval(retry); };
  }, [room.phase, room.slug, updatePhase]);

  return (
    <Shell step={2}>
      <main className="safe-page page-in mx-auto max-w-5xl pb-16 pt-6 sm:pb-20 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)] lg:gap-10 lg:items-start">
          <section>
            <SectionTitle
              eyebrow="02 / group sync"
              title="Look at that overlap."
               body="We weighted the group’s strongest signals, kept minority picks in the mix, and protected every hard no."
            />
            <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-4 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52] sm:p-5">
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

            <div
              className="mt-8 rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5] p-5 shadow-[4px_4px_0_#27304C] focus:outline-none focus-visible:outline-3 focus-visible:outline-[#F26F52] focus-visible:outline-offset-2"
              tabIndex={0}
              role="region"
              aria-label="Voting transition status"
              data-testid="status-voting-transition"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#B7DBD7] text-[#1F655B]">
                  <LoaderCircle size={19} className="animate-spin" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#27304C]">The vote is next</h3>
                  <p className="mt-1 text-sm leading-5 text-[#6A6E80]">Take a quick look. Voting opens automatically.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (requestedRef.current || room.phase !== 'shortlist') return;
                  requestedRef.current = true;
                  updatePhase.mutate({ slug: room.slug, data: { phase: 'voting' } }, {
                    onSuccess: (data) => queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data)),
                    onError: () => { requestedRef.current = false; },
                  });
                }}
                disabled={updatePhase.isPending}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#27304C] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FFF7E8] transition-all hover:bg-[#3B4668] active:translate-y-0.5"
                data-testid="button-open-voting"
              >
                <span>Jump to voting now</span>
              </button>
              {updatePhase.isError && <p className="mt-3 text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-voting-error">Couldn’t open voting yet. We’ll keep trying.</p>}
            </div>
          </section>

          <section>
              <div className="mb-4 flex items-end justify-between gap-3">
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
                  <article key={plan.id} data-testid={`card-plan-${plan.id}`} className="group rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/85 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-[#27304C] hover:shadow-[4px_4px_0_#27304C] sm:p-5">
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
                         <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                           <div className="min-w-0">
                            <h3 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h3>
                            <p className="mt-0.5 text-sm text-[#74788A]">{plan.detail}</p>
                          </div>
                           <span className="shrink-0 rounded-full bg-[#DBF1E6] px-2 py-1 font-mono text-[10px] font-medium text-[#277865] sm:px-2.5 sm:text-[11px]">{plan.matchPercent}% match</span>
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
                              <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-[#F26F52]" /> <span data-testid={`text-venue-address-${plan.id}`}>{plan.venue.address}</span></p>
                             <div className="mt-2 flex flex-wrap items-center gap-3">
                               <span>{plan.venue.distanceMeters < 1000 ? `${plan.venue.distanceMeters} m` : `${(plan.venue.distanceMeters / 1000).toFixed(1)} km`} away</span>
                               {plan.venue.rating !== undefined && <span className="flex items-center gap-1"><Star size={13} fill="#F4B942" className="text-[#F4B942]" /> {plan.venue.rating.toFixed(1)}</span>}
                               {plan.venue.openNow !== undefined && <span className="flex items-center gap-1"><Clock3 size={13} /> {plan.venue.openNow ? 'Open now' : 'Closed now'}</span>}
                                <a href={plan.venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-1 font-bold text-[#277865] hover:underline" data-testid={`link-plan-map-${plan.id}`}>Maps <ExternalLink size={12} /></a>
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
