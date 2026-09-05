import { Shell } from '@/components/layout/shell';
import { Button } from '@/components/ui/app-button';
import { ArrowRight, Clock3, Crown, Sparkles, CheckCircle2, Heart, Flame, Users, Utensils, LocateFixed, MapPin, ShieldCheck } from 'lucide-react';
import { useCreateRoom } from '@workspace/api-client-react';
import { saveTokens } from '@/lib/storage';
import { useLocation } from 'wouter';
import { useState, type FormEvent } from 'react';
import { useAppAuth } from '@/lib/auth';

export function HomePage() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const [name, setName] = useState('');
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'ready' | 'unavailable' | 'skipped'>('idle');
  const [roomLocation, setRoomLocation] = useState<{ latitude: number; longitude: number; accuracy: number }>();
  const { isSignedIn, user } = useAppAuth();

  const handleStart = (e: FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (isSignedIn && user?.firstName ? user.firstName : 'Host');
    createRoom.mutate({ data: { name: finalName, ...(roomLocation ? { location: roomLocation } : {}) } }, {
      onSuccess: (data) => {
        saveTokens(data.slug, data.participantToken, data.hostToken);
        setLocation(`/room/${data.slug}`);
      },
    });
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (coords.accuracy > 10000) {
          setRoomLocation(undefined);
          setLocationState('unavailable');
          return;
        }
        setRoomLocation({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy });
        setLocationState('ready');
      },
      () => {
        setRoomLocation(undefined);
        setLocationState('unavailable');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <Shell>
      <main className="safe-page page-in mx-auto grid w-full max-w-6xl gap-10 pb-14 pt-6 sm:gap-12 sm:pb-20 sm:pt-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:pt-8">
        <section>
          <div className="mb-6 inline-flex rotate-[-2deg] items-center gap-2 rounded-full border border-[#D6CDAA] bg-[#FFF1A9] px-3.5 py-2 text-xs font-bold text-[#5D5121] shadow-[3px_3px_0_#D6CDAA]">
            <Sparkles size={15} /> the group chat, but useful
          </div>
          <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[.2em] text-[#F26F52]">planning something with friends?</p>
          <h1 className="font-display max-w-xl text-[clamp(2.5rem,7.5vw,5.2rem)] font-bold leading-[.88] tracking-[-0.08em] text-[#27304C]">
            Too many
            <span className="relative mt-2 block text-[#F26F52]">
              opinions.
              <span className="absolute -bottom-2 left-1 h-2 w-[64%] -rotate-2 rounded-full bg-[#FFE48B]" />
            </span>
            <span className="mt-2 block">One plan.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#5E6377] sm:mt-7 sm:text-lg">
            PlanJam turns scattered “I’m easy”s into a real decision. Everyone picks, the overlap appears, and the crew votes one good plan into existence.
          </p>

          <form onSubmit={handleStart} className="mt-6 flex flex-col gap-4 sm:mt-8">
            <div className="flex w-full max-w-lg flex-col gap-2.5 sm:flex-row sm:items-center">
              <label htmlFor="host-name" className="sr-only">Your name</label>
              <input
                id="host-name"
                type="text"
                placeholder={isSignedIn && user?.firstName ? `Hi ${user.firstName}! Ready to start?` : "What should friends call you?"}
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isSignedIn}
                className="w-full flex-1 min-w-0 rounded-full border-2 border-[#27304C] bg-[#FFFDF5] px-5 py-3.5 text-base font-bold text-[#27304C] shadow-[3px_3px_0_#27304C] outline-none transition-all placeholder:font-medium placeholder:text-[#9B9CA6] focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20"
                data-testid="input-host-name"
              />
              <Button
                type="submit"
                disabled={createRoom.isPending}
                loading={createRoom.isPending}
                testId="button-start-planning"
                className="w-full px-7 py-3.5 text-base whitespace-nowrap sm:w-auto"
              >
                {createRoom.isPending ? 'Starting room…' : 'Start a room'} <ArrowRight size={18} strokeWidth={2.5} />
              </Button>
            </div>
            <div className="max-w-lg rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5]/90 p-4 shadow-[3px_3px_0_#D9D7D0]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#B7DBD7] text-[#27304C] shadow-sm"><MapPin size={19} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="block text-sm font-bold text-[#27304C]">Find real places nearby?</strong>
                    <span className="rounded-full bg-[#E8E3D2] px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-[#717589]">optional</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#717589]">Anchors suggestions for the room, is reduced before storage, and is never shared with guests.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={locationState === 'requesting'}
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#27304C] px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-60 ${locationState === 'ready' ? 'bg-[#37A28C] text-[#FFF7E8] shadow-[2px_2px_0_#27304C]' : 'bg-[#27304C] text-[#FFF7E8] shadow-[2px_2px_0_#F26F52] hover:-translate-y-0.5'}`}
                      data-testid="button-use-location"
                    >
                      <LocateFixed size={14} className={locationState === 'requesting' ? 'animate-spin' : ''} />
                      {locationState === 'requesting' ? 'Locating…' : locationState === 'ready' ? 'Location ready' : 'Use my location'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRoomLocation(undefined); setLocationState('skipped'); }}
                      className="rounded-full px-3 py-2 text-xs font-bold text-[#6A6E80] hover:bg-[#EDE9DB]/60 hover:text-[#27304C]"
                      data-testid="button-skip-location"
                    >
                      Skip
                    </button>
                  </div>
                  {locationState === 'ready' && <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-[#277865]" role="status" data-testid="status-location-ready"><ShieldCheck size={14} /> Ready for real nearby suggestions</p>}
                  {locationState === 'unavailable' && <p className="mt-2.5 text-xs font-semibold text-[#A83F31]" role="status" data-testid="status-location-unavailable">Location wasn’t available. Starting with curated ideas instead.</p>}
                  {locationState === 'skipped' && <p className="mt-2.5 text-xs font-medium text-[#717589]" role="status" data-testid="status-location-skipped">No problem — curated suggestions will be used.</p>}
                </div>
              </div>
            </div>
            {createRoom.isError && <p className="max-w-lg rounded-xl border border-[#F1B1A6] bg-[#FFD9D3] p-3 text-xs font-bold text-[#A83F31]" role="alert" data-testid="status-start-room-error">We couldn't start that room. Try again in a moment.</p>}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.12em] text-[#8A8D9B]"><Clock3 size={13} /> takes 60 seconds</span>
              <span className="text-[#D9D7D0]">·</span>
              <span className="font-mono text-[11px] uppercase tracking-[.12em] text-[#8A8D9B]">up to 10 friends</span>
            </div>
          </form>

          <div className="mt-12 flex items-center gap-3 border-t border-[#D6D6DF] pt-5 text-sm text-[#717589]">
            <div className="flex -space-x-2">
              {['A', 'R', 'M', 'S'].map((letter, index) => (
                <span key={letter} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#F7F0DA] text-xs font-bold text-[#27304C] ${['bg-[#FFB59F]', 'bg-[#B7DBD7]', 'bg-[#FFE48B]', 'bg-[#D6D7FF]'][index]}`}>
                  {letter}
                </span>
              ))}
            </div>
               <span>no account needed. one shared yes.</span>
          </div>
        </section>

        <section className="relative min-h-[400px] overflow-clip py-4 sm:min-h-[500px]" aria-label="How PlanJam turns opinions into a plan">
          <div className="absolute left-[6%] top-[5%] h-20 w-20 rounded-[28px] border-2 border-[#27304C] bg-[#FFE48B] rotate-12 sm:h-28 sm:w-28" />
          <div className="absolute right-[4%] top-[8%] h-16 w-16 rounded-full border-2 border-[#27304C] bg-[#B7DBD7] sm:h-24 sm:w-24" />
          <div className="absolute bottom-[7%] left-[3%] h-20 w-20 rounded-[50%_50%_45%_45%] border-2 border-[#27304C] bg-[#FFB59F] rotate-[-16deg] sm:h-28 sm:w-28" />
          <div className="absolute bottom-[8%] right-[7%] h-14 w-14 border-2 border-[#27304C] bg-[#D6D7FF] rotate-45 sm:h-20 sm:w-20" />
          <div className="floaty relative mx-auto mt-3 max-w-[440px] rounded-[30px] border-2 border-[#27304C] bg-[#FFF7E8] p-5 shadow-[6px_6px_0_#27304C] sm:mt-8 sm:p-7 sm:shadow-[10px_11px_0_#27304C]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#8A8D9B]">from “whatever works”</p>
                <h2 className="font-display mt-1 text-2xl font-bold tracking-[-.05em] text-[#27304C]">to “it’s settled.”</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]"><Crown size={23} /></div>
            </div>
            <div className="space-y-3">
              <div className="relative rounded-2xl border border-[#DDD8C8] bg-[#F0EDE1] p-4">
                <span className="absolute -top-2 left-3 rounded-full bg-[#FFB59F] px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-wide text-[#7C362C]">the problem</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['food?', 'movie?', 'idk', 'nearby pls'].map((text, index) => <span key={text} className={`rounded-full px-3 py-1.5 text-xs font-bold text-[#27304C] ${['bg-[#FFE48B]', 'bg-[#D6D7FF]', 'bg-[#B7DBD7]', 'bg-[#FFF7E8]'][index]}`}>{text}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 text-[#F26F52]"><span className="h-px flex-1 bg-[#F26F52]/40" /><Sparkles size={16} /><span className="h-px flex-1 bg-[#F26F52]/40" /></div>
              <div className="relative rounded-2xl border-2 border-[#27304C] bg-[#FFFDF5] p-4 shadow-[3px_3px_0_#B7DBD7]">
                <span className="absolute -top-2 left-3 rounded-full bg-[#B7DBD7] px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-wide text-[#1F655B]">the payoff</span>
                <div className="flex items-center gap-3 pt-1">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFB59F] text-[#27304C]"><Utensils size={20} /></span>
                  <div className="min-w-0"><strong className="block truncate text-sm text-[#27304C]">Street Food Safari</strong><span className="font-mono text-[10px] uppercase tracking-wide text-[#F26F52]">94% group match · tonight</span></div>
                  <CheckCircle2 size={20} className="ml-auto shrink-0 text-[#37A28C]" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#5E6377]"><Users size={15} className="text-[#37A28C]" /> everyone gets a say, nobody gets stuck</div>
          </div>
          <div className="absolute left-0 top-[43%] hidden -rotate-12 items-center gap-2 rounded-xl border-2 border-[#27304C] bg-[#FFF7E8] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#27304C] sm:flex"><Heart size={14} fill="#F26F52" className="text-[#F26F52]" /> less “idk”</div>
          <div className="absolute bottom-[18%] right-0 hidden rotate-6 items-center gap-2 rounded-xl border-2 border-[#27304C] bg-[#FFF7E8] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#27304C] sm:flex"><Flame size={14} className="text-[#F26F52]" /> more “let's go”</div>
        </section>
      </main>
    </Shell>
  );
}
