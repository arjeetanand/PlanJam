import type { Participant } from '@workspace/api-client-react';
import { CheckCircle2, Clock, Crown } from 'lucide-react';

export function Roster({ participants, capacity }: { participants: Participant[]; capacity: number }) {
  return (
    <div className="rounded-3xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#8A8D9B]">The Crew</h3>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#6A6E80]">{participants.length}/{capacity}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {participants.map((p, index) => {
          const isCreator = index === 0;
          return (
            <div key={p.id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-[#27304C] ${isCreator ? 'bg-[#FFE48B]' : 'bg-[#DCE8FF]'}`}>
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 truncate font-bold text-[#27304C] text-sm flex items-center gap-1.5">
                  {p.name}
                  {isCreator && <Crown size={12} className="text-[#F26F52]" />}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-[#6A6E80]">
                {p.preferencesSubmitted ? (
                  <><CheckCircle2 size={13} className="text-[#37A28C]" /> <span className="text-[#37A28C]">Ready</span></>
                ) : (
                  <><Clock size={13} /> Thinking</>
                )}
              </div>
            </div>
          );
        })}
        {participants.length < capacity && Array.from({ length: capacity - participants.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-[#D9D7D0] border-dashed p-3 opacity-50">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E8E3D2] text-[#8A8D9B]">?</span>
            <span className="text-sm font-semibold text-[#8A8D9B]">Waiting...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
