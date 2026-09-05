import { Shell } from '@/components/layout/shell';
import { Button } from '@/components/ui/app-button';
import { ArrowRight, Clock3, Crown, Sparkles, CheckCircle2, Heart, Flame, Users, Utensils } from 'lucide-react';
import { useCreateRoom } from '@workspace/api-client-react';
import { saveTokens } from '@/lib/storage';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useAppAuth } from '@/lib/auth';

export function HomePage() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const [name, setName] = useState('');
  const { isSignedIn, user } = useAppAuth();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (isSignedIn && user?.firstName ? user.firstName : 'Host');
    createRoom.mutate({ data: { name: finalName } }, {
      onSuccess: (data) => {
        saveTokens(data.slug, data.participantToken, data.hostToken);
        setLocation(`/room/${data.slug}`);
      }
    });
  };

  return (
    <Shell>
      <main className="page-in mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:pt-16">
        <section>
          <div className="mb-6 inline-flex rotate-[-2deg] items-center gap-2 rounded-full border border-[#D6CDAA] bg-[#FFF1A9] px-3.5 py-2 text-xs font-bold text-[#5D5121] shadow-[3px_3px_0_#D6CDAA]">
            <Sparkles size={15} /> the group chat, but useful
          </div>
          <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[.2em] text-[#F26F52]">planning something with friends?</p>
          <h1 className="font-display max-w-xl text-[clamp(3.7rem,10vw,7.6rem)] font-bold leading-[.86] tracking-[-0.085em] text-[#27304C]">
            Too many
            <span className="relative mt-2 block text-[#F26F52]">
              opinions.
              <span className="absolute -bottom-3 left-1 h-2 w-[64%] -rotate-2 rounded-full bg-[#FFE48B]" />
            </span>
            <span className="mt-2 block">One plan.</span>
          </h1>
          <p className="mt-9 max-w-md text-lg leading-7 text-[#5E6377]">
            PlanJam turns scattered “I’m easy”s into a real decision. Everyone picks, the overlap appears, and the crew votes one good plan into existence.
          </p>
          
          <form onSubmit={handleStart} className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Your name" 
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isSignedIn}
                className="rounded-full border border-[#D9D7D0] bg-[#FFFDF5] px-4 py-3.5 text-base font-bold text-[#27304C] outline-none focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20 sm:w-48"
                data-testid="input-host-name"
              />
              <Button type="submit" disabled={createRoom.isPending} testId="button-start-planning" className="px-7 py-3.5 text-base whitespace-nowrap">
                {createRoom.isPending ? 'Starting...' : 'Start a room'} <ArrowRight size={18} strokeWidth={2.5} />
              </Button>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.12em] text-[#8A8D9B]"><Clock3 size={13} /> takes 60 seconds</span>
          </form>

          <div className="mt-12 flex items-center gap-3 border-t border-[#D6D6DF] pt-5 text-sm text-[#717589]">
            <div className="flex -space-x-2">
              {['A', 'R', 'M', 'S'].map((letter, index) => (
                <span key={letter} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#F7F0DA] text-xs font-bold text-[#27304C] ${['bg-[#FFB59F]', 'bg-[#B7DBD7]', 'bg-[#FFE48B]', 'bg-[#D6D7FF]'][index]}`}>
                  {letter}
                </span>
              ))}
            </div>
            <span>four friends. one shared yes.</span>
          </div>
        </section>

        <section className="relative min-h-[430px] sm:min-h-[500px]" aria-label="How PlanJam turns opinions into a plan">
          <div className="absolute left-[6%] top-[5%] h-20 w-20 rounded-[28px] border-2 border-[#27304C] bg-[#FFE48B] rotate-12 sm:h-28 sm:w-28" />
          <div className="absolute right-[4%] top-[8%] h-16 w-16 rounded-full border-2 border-[#27304C] bg-[#B7DBD7] sm:h-24 sm:w-24" />
          <div className="absolute bottom-[7%] left-[3%] h-20 w-20 rounded-[50%_50%_45%_45%] border-2 border-[#27304C] bg-[#FFB59F] rotate-[-16deg] sm:h-28 sm:w-28" />
          <div className="absolute bottom-[8%] right-[7%] h-14 w-14 border-2 border-[#27304C] bg-[#D6D7FF] rotate-45 sm:h-20 sm:w-20" />
          <div className="floaty relative mx-auto mt-3 max-w-[440px] rounded-[30px] border-2 border-[#27304C] bg-[#FFF7E8] p-5 shadow-[10px_11px_0_#27304C] sm:mt-8 sm:p-7">
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
