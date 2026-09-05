import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/shell';
import { SectionTitle } from '@/components/ui/section-title';
import { Button } from '@/components/ui/app-button';
import { Roster } from './roster';
import { RoomShare } from './room-share';
import { activityOptions, budgetOptions, distanceOptions, noOptions } from '@/lib/constants';
import {
  type RoomState,
  type PreferenceInput,
  useUpdateRoomPreferences,
  getGetRoomStateQueryKey
} from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { mergeRoomState } from '@/lib/room-cache';
import { Check, WalletCards, Compass, Ban, CheckCircle2, MapPin, LoaderCircle, Users } from 'lucide-react';

export function PreferencesPhase({ room }: { room: RoomState }) {
  const headers = getAuthHeaders(room.slug);

  const updatePrefs = useUpdateRoomPreferences({ request: { headers } });
  const [prefs, setPrefs] = useState<PreferenceInput>({
    activity: room.viewerPreferences?.activity || 'food',
    budget: room.viewerPreferences?.budget || '1000',
    distance: room.viewerPreferences?.distance || 'nearby',
    hardNos: room.viewerPreferences?.hardNos || [],
  });
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saved' | 'error'>('idle');

  const serverPrefsStr = JSON.stringify(room.viewerPreferences);
  useEffect(() => {
    if (room.viewerPreferences) {
      setPrefs(room.viewerPreferences);
    }
  }, [serverPrefsStr]);

  const handleSave = () => {
    setSaveFeedback('idle');
    updatePrefs.mutate({ slug: room.slug, data: prefs }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data));
        setSaveFeedback('saved');
      },
      onError: () => setSaveFeedback('error'),
    });
  };

  const toggleNo = (item: any) => {
    setPrefs(p => ({
      ...p,
      hardNos: p.hardNos.includes(item)
        ? p.hardNos.filter(x => x !== item)
        : [...p.hardNos, item]
    }));
  };

  const viewer = room.participants.find(p => p.id === room.viewerParticipantId);
  const submittedCount = room.participants.filter((participant) => participant.preferencesSubmitted).length;
  const everyoneReady = room.participants.length >= 2 && submittedCount === room.participants.length;
  const waitingCount = Math.max(room.participants.length - submittedCount, 0);

  const serverPrefs = room.viewerPreferences;
  const isDirty = !serverPrefs ||
    prefs.activity !== serverPrefs.activity ||
    prefs.budget !== serverPrefs.budget ||
    prefs.distance !== serverPrefs.distance ||
    JSON.stringify([...prefs.hardNos].sort()) !== JSON.stringify([...(serverPrefs.hardNos || [])].sort());

  return (
    <Shell step={1}>
      <main className="safe-page page-in mx-auto grid max-w-6xl gap-8 pb-24 pt-6 sm:gap-10 sm:pb-20 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-8 flex items-end justify-between gap-4">
            <SectionTitle
              eyebrow="01 / your vibe"
              title="What sounds good?"
              body="Start with your gut. A few quick picks give the group something to work with."
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-[-.04em] text-[#27304C]">Choose a starting point</h2>
            <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#8A8D9B]"><Check size={13} className="mr-1 inline text-[#37A28C]" /> required</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {activityOptions.map(({ label, value, sub, icon: Icon, tint }) => {
              const selected = prefs.activity === value;
              return (
                <button
                  type="button"
                  aria-pressed={selected}
                  key={value}
                  onClick={() => setPrefs({ ...prefs, activity: value })}
                  data-testid={`option-activity-${value}`}
                  className={`group relative min-h-[120px] cursor-pointer rounded-2xl border-2 p-3 text-left transition-all duration-150 sm:min-h-[136px] sm:p-4 ${selected ? 'border-[#27304C] bg-[#FFFDF5] shadow-[4px_4px_0_#27304C] -translate-y-0.5' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 hover:-translate-y-0.5 hover:border-[#27304C] hover:bg-[#FFFDF5]'}`}
                >
                  <span className={`mb-3 grid h-10 w-10 sm:mb-5 sm:h-11 sm:w-11 place-items-center rounded-xl border border-[#27304C]/15 ${tint} text-[#27304C] shadow-sm transition-transform group-hover:rotate-[-4deg]`}><Icon size={20} className="sm:h-[22px] sm:w-[22px]" /></span>
                  <strong className="block text-[13px] leading-snug font-bold text-[#27304C] sm:text-sm">{label}</strong>
                  <span className="mt-0.5 block text-[11px] leading-snug font-medium text-[#7C7F91] sm:text-xs">{sub}</span>
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 grid h-5 w-5 sm:right-3 sm:top-3 sm:h-6 sm:w-6 place-items-center rounded-full bg-[#27304C] text-[#FFF7E8] shadow-sm animate-in zoom-in-75 duration-150">
                      <Check size={12} className="sm:h-3.5 sm:w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8">
            <div className="rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5]/80 p-4 sm:p-5 shadow-[3px_3px_0_#D9D7D0]">
              <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold tracking-[-.04em] text-[#27304C] sm:text-xl">
                <WalletCards size={18} className="text-[#F26F52] sm:h-5 sm:w-5" /> Budget per person
              </h2>
              <p className="text-xs text-[#7C7F91]">What you’re comfortable spending</p>
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:gap-2.5">
                {budgetOptions.map((item) => (
                  <button
                    type="button"
                    aria-pressed={prefs.budget === item.value}
                    key={item.value}
                    onClick={() => setPrefs({ ...prefs, budget: item.value as any })}
                    data-testid={`option-budget-${item.value}`}
                    className={`cursor-pointer rounded-xl border-2 px-2.5 py-2.5 text-xs font-bold sm:px-3.5 sm:py-3 sm:text-sm transition-all duration-150 ${prefs.budget === item.value ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#F26F52] -translate-y-0.5' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C] hover:bg-[#FFFDF5]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5]/80 p-4 sm:p-5 shadow-[3px_3px_0_#D9D7D0]">
              <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold tracking-[-.04em] text-[#27304C] sm:text-xl">
                <Compass size={18} className="text-[#F26F52] sm:h-5 sm:w-5" /> How far are we going?
              </h2>
              <p className="text-xs text-[#7C7F91]">Max travel distance</p>
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:gap-2.5">
                {distanceOptions.map((item) => (
                  <button
                    type="button"
                    aria-pressed={prefs.distance === item.value}
                    key={item.value}
                    onClick={() => setPrefs({ ...prefs, distance: item.value as any })}
                    data-testid={`option-distance-${item.value}`}
                    className={`cursor-pointer rounded-xl border-2 px-2.5 py-2.5 text-xs font-bold sm:px-3.5 sm:py-3 sm:text-sm transition-all duration-150 ${prefs.distance === item.value ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#B7DBD7] -translate-y-0.5' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C] hover:bg-[#FFFDF5]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5]/80 p-5 shadow-[3px_3px_0_#D9D7D0]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em] text-[#27304C]">
                  <Ban size={20} className="text-[#F26F52]" /> Any hard NOs?
                </h2>
                <p className="mt-1 text-xs text-[#7C7F91]">We promise never to suggest anything with your hard NOs.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {noOptions.map((item) => {
                const selected = prefs.hardNos.includes(item.value as any);
                return (
                  <button
                    type="button"
                    aria-pressed={selected}
                    key={item.value}
                    onClick={() => toggleNo(item.value)}
                    data-testid={`option-no-${item.value}`}
                    className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-150 ${selected ? 'border-[#A83F31] bg-[#FFD9D3] text-[#A83F31] shadow-[2px_2px_0_#A83F31] -translate-y-0.5' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#6A6E80] hover:border-[#A83F31] hover:text-[#A83F31]'}`}
                  >
                    {selected && <Check size={14} className="mr-1.5 inline" strokeWidth={3} />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-stretch gap-4 border-t-2 border-[#E8E3D2] pt-6 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={updatePrefs.isPending}
                loading={updatePrefs.isPending}
                testId="button-save-preferences"
                className="px-7 py-3.5 text-base"
              >
                {updatePrefs.isPending ? 'Saving…' : viewer?.preferencesSubmitted ? (isDirty ? 'Update choices' : 'Choices locked') : 'Lock in choices'}
              </Button>
              {isDirty && (
                <span className="hidden text-xs font-bold text-[#F26F52] min-[600px]:inline">
                  • Unsaved changes
                </span>
              )}
            </div>

            {(!isDirty && (viewer?.preferencesSubmitted || saveFeedback === 'saved')) && (
              <span className="flex items-center gap-2 rounded-full bg-[#DBF1E6] px-3.5 py-1.5 text-sm font-bold text-[#277865] border border-[#277865]/30" aria-live="polite" data-testid="status-preferences-saved">
                <CheckCircle2 size={16} /> Saved & ready
              </span>
            )}
            {saveFeedback === 'error' && (
              <span className="rounded-full bg-[#FFD9D3] px-3 py-1 text-sm font-bold text-[#A83F31]" role="alert" data-testid="status-preferences-error">
                Couldn’t save. Try again.
              </span>
            )}
          </div>
        </div>

        <aside className="space-y-6">
           <div className="rounded-2xl border border-[#D9D7D0] bg-[#FFFDF5] p-4" data-testid="status-suggestion-source">
            <p className="flex items-center gap-2 text-sm font-bold text-[#27304C]"><MapPin size={16} className="text-[#F26F52]" /> Suggestion source</p>
            <p className="mt-1 text-xs leading-5 text-[#717589]">
              {room.venueStatus === 'nearby-ready'
                ? 'Nearby search is ready. The host’s private room location will be used when the shortlist is made.'
                : 'This room will use PlanJam’s curated suggestions. No location is shared.'}
            </p>
          </div>
          <RoomShare slug={room.slug} participantCount={room.participants.length} capacity={room.capacity} />
           <Roster participants={room.participants} capacity={room.capacity} />

           <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]" data-testid="status-next-steps">
            <div className="mb-3 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${everyoneReady ? 'bg-[#B7DBD7] text-[#1F655B]' : 'bg-[#FFE48B] text-[#27304C]'}`}>
                {everyoneReady ? <LoaderCircle size={16} className="animate-spin" /> : <Users size={16} />}
              </span>
              <h3 className="font-display text-lg font-bold text-[#FFF7E8]">{everyoneReady ? 'Building your shortlist' : 'You’re in'}</h3>
            </div>
            <p className="text-sm leading-6 text-[#B8BBC8]">
              {everyoneReady
                ? 'Everyone is ready. We’re finding three options the group can actually agree on.'
                : viewer?.preferencesSubmitted
                  ? room.participants.length < 2
                    ? 'You’re ready. Share the invite to bring in at least one friend.'
                    : `You’re ready. ${waitingCount} ${waitingCount === 1 ? 'person is' : 'people are'} still choosing.`
                  : 'Lock in your choices when you’re ready. The next step starts automatically.'}
            </p>
          </div>
        </aside>
      </main>

      {isDirty && (
        <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] z-40 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5] p-3.5 shadow-[5px_5px_0_#27304C] sm:hidden">
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#27304C]">Unsaved changes</span>
            <span className="block text-[11px] font-medium text-[#7C7F91] truncate">Tap save to update room</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={updatePrefs.isPending}
            className="flex items-center gap-1.5 rounded-full border-2 border-[#27304C] bg-[#F26F52] px-4 py-2 text-xs font-bold text-[#FFF7E8] shadow-[2px_2px_0_#27304C] active:translate-y-0.5 shrink-0"
          >
            {updatePrefs.isPending ? 'Saving…' : 'Lock in'}
          </button>
        </div>
      )}
    </Shell>
  );
}
