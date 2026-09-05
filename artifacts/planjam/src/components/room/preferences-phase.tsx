import { useState, useRef, useEffect, useCallback } from 'react';
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
  useUpdateRoomPhase,
  getGetRoomStateQueryKey 
} from '@workspace/api-client-react';
import { getAuthHeaders } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { mergeRoomState } from '@/lib/room-cache';
import { Check, WalletCards, Compass, Ban, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';

export function PreferencesPhase({ room }: { room: RoomState }) {
  const headers = getAuthHeaders(room.slug);

  const updatePrefs = useUpdateRoomPreferences({ request: { headers } });
  const updatePhase = useUpdateRoomPhase({ request: { headers } });
  
  const [prefs, setPrefs] = useState<PreferenceInput>({
    activity: room.viewerPreferences?.activity || 'food',
    budget: room.viewerPreferences?.budget || '1000',
    distance: room.viewerPreferences?.distance || 'nearby',
    hardNos: room.viewerPreferences?.hardNos || [],
  });

  const serverPrefsStr = JSON.stringify(room.viewerPreferences);
  useEffect(() => {
    if (room.viewerPreferences) {
      setPrefs(room.viewerPreferences);
    }
  }, [serverPrefsStr]);
  
  const handleSave = () => {
    updatePrefs.mutate({ slug: room.slug, data: prefs }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data));
      }
    });
  };

  const handleGenerateShortlist = () => {
    updatePhase.mutate({ slug: room.slug, data: { phase: 'shortlist' } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRoomStateQueryKey(room.slug), (old: any) => mergeRoomState(old, data));
      }
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
  const everyoneReady = room.participants.length >= 2 && room.participants.every(p => p.preferencesSubmitted);
  const isHost = room.isHost;

  return (
    <Shell step={1}>
      <main className="page-in mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_340px]">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activityOptions.map(({ label, value, sub, icon: Icon, tint }) => {
              const selected = prefs.activity === value;
              return (
                <button type="button" aria-pressed={selected} key={value} onClick={() => setPrefs({ ...prefs, activity: value })} data-testid={`option-activity-${value}`} className={`group relative min-h-[130px] rounded-2xl border-2 p-4 text-left transition-all duration-200 ${selected ? 'border-[#27304C] bg-[#FFF7E8] shadow-[4px_4px_0_#27304C] -translate-y-1' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 hover:-translate-y-0.5 hover:border-[#A8A8B1]'}`}>
                  <span className={`mb-6 grid h-10 w-10 place-items-center rounded-xl ${tint} text-[#27304C] transition-transform group-hover:rotate-[-5deg]`}><Icon size={20} /></span>
                  <strong className="block text-sm text-[#27304C]">{label}</strong><span className="mt-0.5 block text-xs text-[#828596]">{sub}</span>
                  {selected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#27304C] text-[#FFF7E8]"><Check size={12} strokeWidth={3} /></span>}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><WalletCards size={19} className="text-[#F26F52]" /> budget per person</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {budgetOptions.map((item) => <button type="button" aria-pressed={prefs.budget === item.value} key={item.value} onClick={() => setPrefs({ ...prefs, budget: item.value as any })} data-testid={`option-budget-${item.value}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.budget === item.value ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item.label}</button>)}
              </div>
            </div>
            <div>
              <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Compass size={19} className="text-[#F26F52]" /> how far are we going?</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {distanceOptions.map((item) => <button type="button" aria-pressed={prefs.distance === item.value} key={item.value} onClick={() => setPrefs({ ...prefs, distance: item.value as any })} data-testid={`option-distance-${item.value}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.distance === item.value ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#B7DBD7]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item.label}</button>)}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#D9D7D0] pt-8">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Ban size={19} className="text-[#F26F52]" /> any hard NOs?</h2></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {noOptions.map((item) => {
                const selected = prefs.hardNos.includes(item.value as any);
                return <button type="button" aria-pressed={selected} key={item.value} onClick={() => toggleNo(item.value)} data-testid={`option-no-${item.value}`} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${selected ? 'border-[#F26F52] bg-[#FFD9D3] text-[#A83F31] shadow-[2px_2px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#6A6E80] hover:border-[#F26F52]'}`}>{selected && <Check size={14} className="mr-1 inline" />}{item.label}</button>;
              })}
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-[#D9D7D0] pt-6">
            <Button onClick={handleSave} disabled={updatePrefs.isPending} testId="button-save-preferences">
              {viewer?.preferencesSubmitted ? 'Update Preferences' : 'Lock in choices'}
            </Button>
            {viewer?.preferencesSubmitted && <span className="flex items-center gap-1.5 text-sm font-bold text-[#37A28C]"><CheckCircle2 size={16} /> Saved</span>}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[#D9D7D0] bg-[#FFFDF5] p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-[#27304C]"><MapPin size={16} className="text-[#F26F52]" /> Suggestion source</p>
            <p className="mt-1 text-xs leading-5 text-[#717589]">
              {room.venueStatus === 'nearby-ready'
                ? 'Nearby search is ready. The host’s private room location will be used when the shortlist is made.'
                : 'This room will use PlanJam’s curated suggestions. No location is shared.'}
            </p>
          </div>
          <RoomShare slug={room.slug} />
          <Roster participants={room.participants} isHost={isHost} />
          
          <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]">
            <h3 className="mb-2 font-display text-lg font-bold text-[#FFF7E8]">Next Steps</h3>
            {isHost ? (
              <>
                <p className="mb-4 text-sm text-[#B8BBC8]">Wait for everyone to lock in their choices, then generate the shortlist.</p>
                <Button 
                  onClick={handleGenerateShortlist} 
                  disabled={!everyoneReady || updatePhase.isPending} 
                  variant="primary" 
                  className="w-full"
                  testId="button-generate-shortlist"
                >
                  Generate Shortlist <ArrowRight size={16} />
                </Button>
                {!everyoneReady && <p className="mt-3 text-center text-[11px] font-mono text-[#F26F52]">waiting for {Math.max(2, room.participants.length)} readys</p>}
              </>
            ) : (
              <p className="text-sm text-[#B8BBC8]">
                Wait for the host ({room.participants[0]?.name}) to generate the shortlist once everyone is ready.
              </p>
            )}
          </div>
        </aside>
      </main>
    </Shell>
  );
}
