import { useState } from 'react';
import type { Participant } from '@workspace/api-client-react';
import { CheckCircle2, ChevronDown, Clock, Crown } from 'lucide-react';
import { activityOptions, budgetOptions, distanceOptions, noOptions } from '@/lib/constants';

const AVATAR_COLORS = [
  'bg-[#FFE48B] text-[#27304C]',
  'bg-[#B7DBD7] text-[#1F655B]',
  'bg-[#FFB59F] text-[#7C362C]',
  'bg-[#E0E1FF] text-[#363B82]',
  'bg-[#FFF1A9] text-[#5D5121]',
];

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
    <div className="rounded-3xl border-2 border-[#27304C] bg-[#FFFDF5] p-5 shadow-[4px_4px_0_#27304C]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#F26F52]">The Crew</h3>
          <p className="font-display text-base font-bold text-[#27304C]">Who's in the room</p>
        </div>
        <span className="rounded-full bg-[#27304C] px-2.5 py-1 font-mono text-[10px] font-bold text-[#FFF7E8]">
          {participants.length}/{capacity}
        </span>
      </div>
      <div
        aria-live="polite"
        data-testid="roster-readiness-summary"
        className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D9D7D0] bg-[#FFF7E8]/70 px-3.5 py-2.5 text-xs font-bold text-[#27304C]"
      >
        <span className="flex items-center gap-1.5 text-[#277865]">
          <CheckCircle2 size={15} />
          <span>{readyCount}/{participants.length} ready</span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${waitingCount > 0 ? 'bg-[#FFD9D3] text-[#A83F31]' : 'bg-[#DBF1E6] text-[#1F655B]'}`}>
          {waitingCount > 0 ? `${waitingCount} thinking` : 'All set!'}
        </span>
      </div>
      <div className="space-y-2.5" data-testid="roster-list">
        {participants.map((p, index) => {
          const isCreator = index === 0;
          const isExpanded = expandedParticipantId === p.id && !!p.selection;
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return (
            <div key={p.id} className="min-w-0 rounded-2xl border-2 border-[#D9D7D0] bg-[#FFFDF5] p-3 transition-all hover:border-[#27304C]" data-testid={`roster-member-${p.id}`}>
              <button
                type="button"
                disabled={!p.selection}
                aria-expanded={isExpanded}
                aria-controls={p.selection ? `selection-${p.id}` : undefined}
                onClick={() => setExpandedParticipantId(isExpanded ? null : p.id)}
                data-testid={`button-roster-member-${p.id}`}
                className={`flex w-full min-w-0 items-center justify-between gap-2 text-left ${p.selection ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-sm ${avatarColor}`}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate font-display text-sm font-bold text-[#27304C] flex items-center gap-1.5">
                    {p.name}
                    {isCreator && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFE48B] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#27304C]">
                        <Crown size={10} className="text-[#F26F52]" /> Host
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wide">
                  {p.preferencesSubmitted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DBF1E6] px-2 py-0.5 font-bold text-[#1F655B]">
                      <CheckCircle2 size={12} /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EDE1] px-2 py-0.5 text-[#6A6E80]">
                      <Clock size={12} /> Thinking
                    </span>
                  )}
                  {p.selection && <ChevronDown size={14} className={`text-[#27304C] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
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
                          <span key={hardNo} className="rounded-full bg-[#FFD9D3] px-2 py-0.5 text-[10px] font-bold text-[#A83F31]">
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
          <div key={`empty-${i}`} className="flex items-center gap-3 rounded-2xl border-2 border-[#D9D7D0] border-dashed bg-[#FFF7E8]/40 p-3 opacity-60">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#E8E3D2] font-mono text-xs font-bold text-[#8A8D9B]">?</span>
            <span className="text-xs font-medium text-[#8A8D9B]">Waiting for friend to join…</span>
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
