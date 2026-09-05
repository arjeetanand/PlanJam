import { useState } from 'react';
import type { Participant } from '@workspace/api-client-react';
import { CheckCircle2, ChevronDown, Clock, Crown } from 'lucide-react';
import { activityOptions, budgetOptions, distanceOptions, noOptions } from '@/lib/constants';

export function Roster({
  participants,
  capacity,
  showEmptySlots = true,
}: {
  participants: Participant[];
  capacity: number;
  showEmptySlots?: boolean;
}) {
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const readyCount = participants.filter((participant) => participant.preferencesSubmitted).length;
  const waitingCount = participants.length - readyCount;

  return (
    <div className="rounded-3xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#8A8D9B]">The Crew</h3>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#6A6E80]">{participants.length}/{capacity}</span>
      </div>
      <div
        aria-live="polite"
        data-testid="roster-readiness-summary"
        className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] px-3 py-2 text-xs font-bold text-[#27304C]"
      >
        <span className="flex items-center gap-1.5 text-[#37A28C]">
          <CheckCircle2 size={14} />
          {readyCount}/{participants.length} ready
        </span>
        <span aria-hidden="true" className="text-[#B0AFB5]">·</span>
        <span className={waitingCount > 0 ? 'text-[#A83F31]' : 'text-[#37A28C]'}>
          {waitingCount > 0 ? `${waitingCount} waiting` : 'Everyone ready'}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2" data-testid="roster-list">
        {participants.map((p, index) => {
          const isCreator = index === 0;
          const isExpanded = expandedParticipantId === p.id && !!p.selection;
          return (
            <div key={p.id} className="min-w-0 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] p-3 shadow-sm" data-testid={`roster-member-${p.id}`}>
              <button
                type="button"
                disabled={!p.selection}
                aria-expanded={isExpanded}
                aria-controls={p.selection ? `selection-${p.id}` : undefined}
                onClick={() => setExpandedParticipantId(isExpanded ? null : p.id)}
                data-testid={`button-roster-member-${p.id}`}
                className={`flex w-full min-w-0 items-center justify-between gap-2 text-left ${p.selection ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-[#27304C] ${isCreator ? 'bg-[#FFE48B]' : 'bg-[#DCE8FF]'}`}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate font-bold text-[#27304C] text-sm flex items-center gap-1.5">
                    {p.name}
                    {isCreator && <Crown size={12} className="shrink-0 text-[#F26F52]" />}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-[#6A6E80]">
                  {p.preferencesSubmitted ? (
                    <><CheckCircle2 size={13} className="text-[#37A28C]" /> <span className="text-[#37A28C]">Ready</span></>
                  ) : (
                    <><Clock size={13} /> Thinking</>
                  )}
                  {p.selection && <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                </span>
              </button>
              {isExpanded && p.selection && (
                <div id={`selection-${p.id}`} className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E3D2] pt-3 sm:grid-cols-4">
                  <SelectionItem label="Activity" value={labelFor(activityOptions, p.selection.activity)} />
                  <SelectionItem label="Budget" value={labelFor(budgetOptions, p.selection.budget)} />
                  <SelectionItem label="Distance" value={labelFor(distanceOptions, p.selection.distance)} />
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block font-mono text-[9px] font-bold uppercase tracking-wide text-[#8A8D9B]">Hard NOs</span>
                    {p.selection.hardNos.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.selection.hardNos.map((hardNo) => (
                          <span key={hardNo} className="rounded-full bg-[#FFD9D3] px-2 py-0.5 text-[10px] font-semibold text-[#A83F31]">
                            {labelFor(noOptions, hardNo)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="mt-1 block text-xs font-semibold text-[#6A6E80]">None</span>
                    )}
                  </div>
                </div>
              )}
              {p.preferencesSubmitted && !p.selection && (
                <p className="mt-2 text-[10px] font-semibold text-[#8A8D9B]">Selection details unavailable</p>
              )}
            </div>
          );
        })}
        {showEmptySlots && participants.length < capacity && Array.from({ length: capacity - participants.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-[#D9D7D0] border-dashed p-3 opacity-50">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E8E3D2] text-[#8A8D9B]">?</span>
            <span className="text-sm font-semibold text-[#8A8D9B]">Waiting...</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function labelFor(options: readonly { label: string; value: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function SelectionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block font-mono text-[9px] font-bold uppercase tracking-wide text-[#8A8D9B]">{label}</span>
      <span className="mt-1 block truncate text-xs font-semibold text-[#27304C]">{value}</span>
    </div>
  );
}
