import { Shell } from '@/components/layout/shell';
import { SectionTitle } from '@/components/ui/section-title';
import { type RoomState } from '@workspace/api-client-react';
import { Crown, Heart, Check, Ban, Utensils, Film, Gamepad2, Sun, Waves, PartyPopper, MapPin, Navigation, Star, Clock3, type LucideIcon } from 'lucide-react';
import { RoomShare } from './room-share';

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

export function FinalPhase({ room }: { room: RoomState }) {
  const winnerPlan = room.shortlist.find(p => p.id === room.winner);
  
  return (
    <Shell step={4}>
      <main className="page-in mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        {/* Simple CSS Confetti Fallback */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className={`confetti-piece absolute top-[-30px] h-3 w-2 rounded-sm ${['bg-[#F26F52]', 'bg-[#FFE48B]', 'bg-[#B7DBD7]', 'bg-[#27304C]'][i % 4]}`}
              style={{ left: `${Math.random() * 100}%`, animationDelay: `${-(Math.random() * 3)}s` }}
            />
          ))}
        </div>
        <div className="text-center mb-10">
          <SectionTitle 
            eyebrow="04 / the verdict" 
            title="We have a winner." 
            body={`The group has spoken. Here's what ${room.participants.length} people agreed on.`}
          />
        </div>

        {winnerPlan ? (
          <div className="rise-in mx-auto max-w-lg overflow-hidden rounded-[32px] border-2 border-[#27304C] bg-[#FFFDF5] shadow-[12px_12px_0_#F26F52]">
            <div className={`p-8 text-center ${PLAN_COLORS[winnerPlan.category] || 'bg-[#FFE48B]'} border-b-2 border-[#27304C]`}>
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-[#27304C] text-[#FFF7E8] shadow-[4px_4px_0_#FFF7E8]">
                {(() => {
                  const Icon = PLAN_ICONS[winnerPlan.category] || Crown;
                  return <Icon size={36} />;
                })()}
              </div>
              <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[#27304C]">
                {winnerPlan.name}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#5D5121] opacity-80">{winnerPlan.detail}</p>
            </div>
            
            <div className="p-8">
              {winnerPlan.venue && (
                <div className="mb-7 rounded-2xl border border-[#D9D7D0] bg-[#F0EDE1] p-4 text-sm text-[#5E6377]">
                  <p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0 text-[#F26F52]" /> {winnerPlan.venue.address}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                    <span>{winnerPlan.venue.distanceMeters < 1000 ? `${winnerPlan.venue.distanceMeters} m` : `${(winnerPlan.venue.distanceMeters / 1000).toFixed(1)} km`} away</span>
                    {winnerPlan.venue.rating !== undefined && <span className="flex items-center gap-1"><Star size={13} fill="#F4B942" className="text-[#F4B942]" /> {winnerPlan.venue.rating.toFixed(1)}</span>}
                    {winnerPlan.venue.openNow !== undefined && <span className="flex items-center gap-1"><Clock3 size={13} /> {winnerPlan.venue.openNow ? 'Open now' : 'Closed now'}</span>}
                  </div>
                  <a href={winnerPlan.venue.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#27304C] px-4 py-3 font-bold text-[#FFF7E8]">
                    <Navigation size={16} /> Open directions
                  </a>
                </div>
              )}
              <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#8A8D9B]">The Score Breakdown</h3>
              <div className="space-y-4">
                {room.voteTotals.map(vt => {
                  const plan = room.shortlist.find(p => p.id === vt.planId);
                  if (!plan) return null;
                  
                  const isWinner = vt.planId === room.winner;
                  
                  return (
                    <div key={vt.planId} className={`rounded-xl border p-4 ${isWinner ? 'border-[#27304C] bg-[#FFF7E8]' : 'border-[#D9D7D0] bg-transparent'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-bold text-[#27304C]">{plan.name}</span>
                        <span className="rounded-full bg-[#E8E3D2] px-2 py-0.5 font-mono text-[10px] font-bold">{vt.score} pts</span>
                      </div>
                      <div className="flex gap-4 text-xs font-semibold">
                        {vt.love > 0 && <span className="flex items-center gap-1 text-[#37A28C]"><Heart size={12} /> {vt.love}</span>}
                        {vt.works > 0 && <span className="flex items-center gap-1 text-[#27304C]"><Check size={12} /> {vt.works}</span>}
                        {vt.no > 0 && <span className="flex items-center gap-1 text-[#A83F31]"><Ban size={12} /> {vt.no}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-[#D9D7D0] pt-6">
                <RoomShare slug={room.slug} participantCount={room.participants.length} capacity={room.capacity} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-10 text-[#6A6E80]">Winner not found</div>
        )}
      </main>
    </Shell>
  );
}
