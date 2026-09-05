import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Crown,
  Film,
  Flame,
  Gamepad2,
  Heart,
  MapPin,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  Users,
  WalletCards,
  Waves,
  Zap,
} from 'lucide-react';
import { useLocation, Router as WouterRouter } from 'wouter';

type Activity = 'Food' | 'Movie' | 'Games' | 'Outdoors' | 'Chill' | 'Party';
type Vote = 'love' | 'works' | 'no';
type Plan = {
  id: string;
  name: string;
  detail: string;
  icon: typeof Utensils;
  color: string;
  match: number;
  reasons: string[];
};
type Preferences = {
  activity: Activity;
  budget: string;
  distance: string;
  hardNos: string[];
};

const initialPreferences: Preferences = {
  activity: 'Food',
  budget: '₹1000',
  distance: 'Nearby',
  hardNos: [],
};

const activityOptions: { label: Activity; sub: string; icon: typeof Utensils; tint: string }[] = [
  { label: 'Food', sub: 'something delicious', icon: Utensils, tint: 'bg-[#FFE6B7]' },
  { label: 'Movie', sub: 'big screen energy', icon: Film, tint: 'bg-[#DCE8FF]' },
  { label: 'Games', sub: 'friendly competition', icon: Gamepad2, tint: 'bg-[#DBF1E6]' },
  { label: 'Outdoors', sub: 'touch some grass', icon: Sun, tint: 'bg-[#FFF1A9]' },
  { label: 'Chill', sub: 'low-key is the key', icon: Waves, tint: 'bg-[#E0E1FF]' },
  { label: 'Party', sub: 'make a little noise', icon: PartyPopper, tint: 'bg-[#FFD9D3]' },
];
const budgetOptions = ['₹500', '₹1000', '₹1500', '₹2000+'];
const distanceOptions = ['Nearby', '5 km', '10 km', 'Anywhere'];
const noOptions = ['Crowds', 'Long drives', 'Loud venues', 'Spicy food', 'Late nights'];

const plans: Plan[] = [
  {
    id: 'street-food',
    name: 'Street Food Safari',
    detail: 'Three stops, zero overthinking',
    icon: Utensils,
    color: 'bg-[#FFB59F]',
    match: 94,
    reasons: ['Fits budget', 'Everyone is available', 'No hard NOs'],
  },
  {
    id: 'bowling',
    name: 'Strike & Snack',
    detail: 'Bowling first, bragging rights forever',
    icon: Gamepad2,
    color: 'bg-[#B7DBD7]',
    match: 88,
    reasons: ['Matches group interests', 'Fits budget', 'Everyone is available'],
  },
  {
    id: 'rooftop',
    name: 'Rooftop Sunset',
    detail: 'Golden hour, shared plates, no rush',
    icon: Sun,
    color: 'bg-[#FFE48B]',
    match: 81,
    reasons: ['No hard NOs', 'Matches group interests', 'Nearby'],
  },
];

function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  testId,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  className?: string;
  disabled?: boolean;
  testId: string;
}) {
  const styles = {
    primary: 'bg-[#F26F52] text-[#FFF7E8] shadow-[0_4px_0_#C54E3A] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_0_#C54E3A]',
    secondary: 'bg-[#FFF7E8] text-[#27304C] border border-[#D6D6DF] shadow-[0_3px_0_#D6D6DF] hover:-translate-y-0.5 active:translate-y-0',
    ghost: 'text-[#5E6377] hover:bg-[#EDE9DB] hover:text-[#27304C]',
    dark: 'bg-[#27304C] text-[#FFF7E8] shadow-[0_4px_0_#11182D] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_0_#11182D]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-testid="button-home-logo" className="group inline-flex items-center gap-2">
      <span className="grid h-9 w-9 rotate-[-7deg] place-items-center rounded-[12px] bg-[#27304C] text-[#FFE48B] shadow-[3px_3px_0_#F26F52] transition-transform group-hover:rotate-3">
        <Zap size={19} strokeWidth={3} />
      </span>
      <span className="font-display text-xl font-bold tracking-[-0.06em] text-[#27304C]">planjam</span>
    </button>
  );
}

function Header({ onHome, step }: { onHome: () => void; step?: number }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Logo onClick={onHome} />
      {step ? (
        <div className="flex items-center gap-3" data-testid="status-progress">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#7C7F91]">plan mode</span>
          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[#DBD8CC] sm:block">
            <div className="h-full rounded-full bg-[#F26F52] transition-all duration-500" style={{ width: `${step * 25}%` }} />
          </div>
          <span className="font-mono text-[11px] font-medium text-[#F26F52]">{step}/4</span>
        </div>
      ) : (
        <div className="hidden items-center gap-2 text-xs font-semibold text-[#7C7F91] sm:flex">
          <Users size={15} /> made for the group chat
        </div>
      )}
    </header>
  );
}

function Shell({ children, step, onHome }: { children: ReactNode; step?: number; onHome: () => void }) {
  return (
    <div className="app-shell">
      <Header onHome={onHome} step={step} />
      {children}
    </div>
  );
}

function HomePage({ start }: { start: () => void }) {
  return (
    <Shell onHome={() => undefined}>
      <main className="page-in mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:pt-20">
        <section>
          <div className="mb-7 inline-flex rotate-[-2deg] items-center gap-2 rounded-full border border-[#D6CDAA] bg-[#FFF1A9] px-3.5 py-2 text-xs font-bold text-[#5D5121] shadow-[3px_3px_0_#D6CDAA]">
            <Sparkles size={15} /> group decisions, minus the chaos
          </div>
          <h1 className="font-display max-w-xl text-[clamp(3.7rem,10vw,7.6rem)] font-bold leading-[.88] tracking-[-0.085em] text-[#27304C]">
            Four opinions.
            <span className="relative mt-2 block text-[#F26F52]">
              One plan.
              <span className="absolute -bottom-3 left-1 h-2 w-[70%] -rotate-2 rounded-full bg-[#FFE48B]" />
            </span>
          </h1>
          <p className="mt-9 max-w-md text-lg leading-7 text-[#5E6377]">
            Everyone picks their vibe. PlanJam finds the overlap, serves up three actually-good ideas, and gets the group moving.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button onClick={start} testId="button-start-planning" className="px-7 py-4 text-base">
              Start planning <ArrowRight size={18} strokeWidth={2.5} />
            </Button>
            <span className="font-mono text-[11px] uppercase tracking-[.12em] text-[#8A8D9B]">takes 60 seconds</span>
          </div>
          <div className="mt-14 flex items-center gap-3 border-t border-[#D6D6DF] pt-5 text-sm text-[#717589]">
            <div className="flex -space-x-2">
              {['A', 'R', 'M', 'S'].map((letter, index) => (
                <span key={letter} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#F7F0DA] text-xs font-bold text-[#27304C] ${['bg-[#FFB59F]', 'bg-[#B7DBD7]', 'bg-[#FFE48B]', 'bg-[#D6D7FF]'][index]}`}>
                  {letter}
                </span>
              ))}
            </div>
            <span>for plans that leave the chat</span>
          </div>
        </section>

        <section className="relative min-h-[390px] sm:min-h-[475px]" aria-label="PlanJam preview">
          <div className="absolute left-[6%] top-[5%] h-20 w-20 rounded-[28px] border-2 border-[#27304C] bg-[#FFE48B] rotate-12 sm:h-28 sm:w-28" />
          <div className="absolute right-[4%] top-[8%] h-16 w-16 rounded-full border-2 border-[#27304C] bg-[#B7DBD7] sm:h-24 sm:w-24" />
          <div className="absolute bottom-[7%] left-[3%] h-20 w-20 rounded-[50%_50%_45%_45%] border-2 border-[#27304C] bg-[#FFB59F] rotate-[-16deg] sm:h-28 sm:w-28" />
          <div className="absolute bottom-[8%] right-[7%] h-14 w-14 border-2 border-[#27304C] bg-[#D6D7FF] rotate-45 sm:h-20 sm:w-20" />
          <div className="floaty relative mx-auto mt-8 max-w-[360px] rotate-[3deg] rounded-[30px] border-2 border-[#27304C] bg-[#FFF7E8] p-5 shadow-[10px_11px_0_#27304C] sm:mt-12 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#DDD8C8] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#8A8D9B]">tonight's common ground</p>
                <h2 className="font-display mt-1 text-2xl font-bold tracking-[-.05em] text-[#27304C]">Good food, close by</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]"><Utensils size={23} /></div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['Street Food Safari', '94% match', 'bg-[#FFB59F]'],
                ['Strike & Snack', '88% match', 'bg-[#B7DBD7]'],
                ['Rooftop Sunset', '81% match', 'bg-[#FFE48B]'],
              ].map(([name, match, color], index) => (
                <div key={name} className="flex items-center gap-3 rounded-2xl border border-[#DAD6C7] bg-[#FFFDF5] p-3" data-testid={`preview-plan-${index}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${color} text-[#27304C]`}><Star size={17} fill="currentColor" /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-[#27304C]">{name}</strong>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[#F26F52]">{match}</span>
                  </span>
                  <ChevronRight size={17} className="text-[#9698A5]" />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#5E6377]"><CheckCircle2 size={15} className="text-[#37A28C]" /> no debates required</div>
          </div>
          <div className="absolute left-0 top-[43%] hidden -rotate-12 items-center gap-2 rounded-xl border-2 border-[#27304C] bg-[#FFF7E8] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#27304C] sm:flex"><Heart size={14} fill="#F26F52" className="text-[#F26F52]" /> less “idk”</div>
          <div className="absolute bottom-[22%] right-0 hidden rotate-6 items-center gap-2 rounded-xl border-2 border-[#27304C] bg-[#FFF7E8] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#27304C] sm:flex"><Flame size={14} className="text-[#F26F52]" /> more “let's go”</div>
        </section>
      </main>
    </Shell>
  );
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.17em] text-[#F26F52]"><span className="h-1.5 w-1.5 rounded-full bg-[#F26F52]" /> {eyebrow}</div>
      <h1 className="font-display text-4xl font-bold leading-[.95] tracking-[-.065em] text-[#27304C] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-lg leading-6 text-[#6A6E80]">{body}</p>
    </div>
  );
}

function PreferencesPage({ prefs, setPrefs, next, back }: { prefs: Preferences; setPrefs: (p: Preferences) => void; next: () => void; back: () => void }) {
  const toggleNo = (item: string) => {
    setPrefs({ ...prefs, hardNos: prefs.hardNos.includes(item) ? prefs.hardNos.filter((value) => value !== item) : [...prefs.hardNos, item] });
  };
  return (
    <Shell step={1} onHome={back}>
      <main className="page-in mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <button type="button" onClick={back} data-testid="button-back-preferences" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#6A6E80] transition-colors hover:text-[#F26F52]"><ArrowLeft size={16} /> back</button>
        <SectionTitle eyebrow="01 / your vibe" title="What sounds good?" body="No essays. Just tap what feels right. There are no wrong answers, only better plans." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activityOptions.map(({ label, sub, icon: Icon, tint }) => {
            const selected = prefs.activity === label;
            return (
              <button type="button" key={label} onClick={() => setPrefs({ ...prefs, activity: label })} data-testid={`option-activity-${label.toLowerCase()}`} className={`group relative min-h-[130px] rounded-2xl border-2 p-4 text-left transition-all duration-200 ${selected ? 'border-[#27304C] bg-[#FFF7E8] shadow-[4px_4px_0_#27304C] -translate-y-1' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 hover:-translate-y-0.5 hover:border-[#A8A8B1]'}`}>
                <span className={`mb-6 grid h-10 w-10 place-items-center rounded-xl ${tint} text-[#27304C] transition-transform group-hover:rotate-[-5deg]`}><Icon size={20} /></span>
                <strong className="block text-sm text-[#27304C]">{label}</strong><span className="mt-0.5 block text-xs text-[#828596]">{sub}</span>
                {selected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#27304C] text-[#FFF7E8]"><Check size={12} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-12 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><WalletCards size={19} className="text-[#F26F52]" /> budget per person</h2>
            <div className="grid grid-cols-2 gap-2">
              {budgetOptions.map((item) => <button type="button" key={item} onClick={() => setPrefs({ ...prefs, budget: item })} data-testid={`option-budget-${item.replace(/\W/g, '')}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.budget === item ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item}</button>)}
            </div>
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Compass size={19} className="text-[#F26F52]" /> how far are we going?</h2>
            <div className="grid grid-cols-2 gap-2">
              {distanceOptions.map((item) => <button type="button" key={item} onClick={() => setPrefs({ ...prefs, distance: item })} data-testid={`option-distance-${item.replace(/\W/g, '')}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.distance === item ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#B7DBD7]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item}</button>)}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#D9D7D0] pt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Ban size={19} className="text-[#F26F52]" /> any hard NOs?</h2>
          <p className="mb-4 mt-1 text-sm text-[#828596]">Protect the peace. Pick as many as you need.</p>
          <div className="flex flex-wrap gap-2">
            {noOptions.map((item) => {
              const selected = prefs.hardNos.includes(item);
              return <button type="button" key={item} onClick={() => toggleNo(item)} data-testid={`option-no-${item.toLowerCase().replace(' ', '-')}`} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${selected ? 'border-[#F26F52] bg-[#FFD9D3] text-[#A83F31] shadow-[2px_2px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#6A6E80] hover:border-[#F26F52]'}`}>{selected && <Check size={14} className="mr-1 inline" />}{item}</button>;
            })}
          </div>
        </div>
        <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-[#D9D7D0] pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#8A8D9B]">your choices stay on this device</span>
          <Button onClick={next} testId="button-see-common-ground">Find our common ground <ArrowRight size={17} /></Button>
        </div>
      </main>
    </Shell>
  );
}

function ResultsPage({ prefs, next, back }: { prefs: Preferences; next: () => void; back: () => void }) {
  const people = [
    { name: 'you', initials: 'Y', color: 'bg-[#FFE48B]' },
    { name: 'Aanya', initials: 'A', color: 'bg-[#FFB59F]' },
    { name: 'Rohan', initials: 'R', color: 'bg-[#B7DBD7]' },
    { name: 'Mira', initials: 'M', color: 'bg-[#D6D7FF]' },
  ];
  return (
    <Shell step={2} onHome={back}>
      <main className="page-in mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <button type="button" onClick={back} data-testid="button-back-results" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#6A6E80] transition-colors hover:text-[#F26F52]"><ArrowLeft size={16} /> tweak preferences</button>
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <section>
            <SectionTitle eyebrow="02 / group sync" title="Okay, we found a lane." body={`You picked ${prefs.activity.toLowerCase()} · ${prefs.budget} · ${prefs.distance.toLowerCase()}. The rest of the crew is weighing in.`} />
            <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]">
              <div className="flex items-center justify-between">
                <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#B7DBD7]">common ground</p><h2 className="font-display mt-2 text-2xl font-bold tracking-[-.05em]">Good vibes nearby</h2></div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]"><Sparkles size={23} /></div>
              </div>
              <div className="my-5 h-px bg-[#545A70]" />
              <div className="space-y-3 text-sm text-[#E9E5D6]">
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> casual plans win tonight</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> nobody wants a long commute</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> under {prefs.budget} feels right</p>
              </div>
              <div className="mt-6 flex items-center gap-2 border-t border-[#545A70] pt-4">
                <div className="flex -space-x-2">{people.map((person) => <span key={person.name} title={person.name} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#27304C] ${person.color} text-[10px] font-bold text-[#27304C]`}>{person.initials}</span>)}</div>
                <span className="ml-1 text-xs text-[#B8BBC8]">4 people aligned</span>
              </div>
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#F26F52]">the shortlist</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-.05em] text-[#27304C]">Three ways to make it happen</h2></div><span className="hidden text-xs text-[#8A8D9B] sm:block">ranked by group match</span></div>
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return <article key={plan.id} data-testid={`card-plan-${plan.id}`} className="group rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/85 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#27304C] hover:shadow-[4px_4px_0_#27304C] sm:p-5">
                  <div className="flex gap-4">
                    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${plan.color} text-[#27304C]`}><Icon size={25} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h3><p className="mt-0.5 text-sm text-[#74788A]">{plan.detail}</p></div><span className="shrink-0 rounded-full bg-[#DBF1E6] px-2.5 py-1 font-mono text-[11px] font-medium text-[#277865]">{plan.match}%</span></div>
                      <div className="mt-4 flex flex-wrap gap-1.5">{plan.reasons.map((reason) => <span key={reason} className="rounded-full bg-[#F0EDE1] px-2.5 py-1 text-[11px] font-semibold text-[#65697A]">{reason}</span>)}</div>
                    </div>
                  </div>
                  {index === 0 && <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#F26F52]"><Crown size={14} /> strongest match</div>}
                </article>;
              })}
            </div>
            <Button onClick={next} testId="button-start-voting" variant="dark" className="mt-6 w-full py-4">Let the group vote <ArrowRight size={18} /></Button>
          </section>
        </div>
      </main>
    </Shell>
  );
}

function VotePage({ votes, setVotes, next, back }: { votes: Record<string, Vote>; setVotes: (v: Record<string, Vote>) => void; next: () => void; back: () => void }) {
  const voteLabels: { value: Vote; label: string; icon: typeof ThumbsUp }[] = [
    { value: 'love', label: 'Love it', icon: ThumbsUp },
    { value: 'works', label: 'Works', icon: Check },
    { value: 'no', label: 'No', icon: ThumbsDown },
  ];
  const votedCount = Object.keys(votes).length;
  return (
    <Shell step={3} onHome={back}>
      <main className="page-in mx-auto max-w-4xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <button type="button" onClick={back} data-testid="button-back-vote" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#6A6E80] transition-colors hover:text-[#F26F52]"><ArrowLeft size={16} /> back to shortlist</button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><SectionTitle eyebrow="03 / quick vote" title="No group chat essay needed." body="Tap the gut reaction. We’ll find the plan with the least convincing required." /><span className="mb-8 inline-flex items-center gap-2 self-start rounded-full bg-[#FFE48B] px-3 py-2 font-mono text-[10px] uppercase tracking-[.11em] text-[#5D5121] sm:mb-8"><Users size={14} /> your vote · {votedCount}/3</span></div>
        <div className="space-y-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return <article key={plan.id} className={`rounded-2xl border-2 bg-[#FFF7E8] p-4 transition-all sm:p-5 ${votes[plan.id] ? 'border-[#27304C] shadow-[4px_4px_0_#B7DBD7]' : 'border-[#D9D7D0]'}`} data-testid={`vote-card-${plan.id}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={`flex min-w-0 flex-1 items-center gap-3`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${plan.color} text-[#27304C]`}><Icon size={22} /></span><div className="min-w-0"><h2 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h2><p className="text-sm text-[#74788A]">{plan.detail}</p></div></div>
                <div className="grid grid-cols-3 gap-2 sm:w-[285px]">
                  {voteLabels.map(({ value, label, icon: VoteIcon }) => {
                    const active = votes[plan.id] === value;
                    return <button type="button" key={value} onClick={() => setVotes({ ...votes, [plan.id]: value })} data-testid={`vote-${value}-${plan.id}`} className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition-all ${active ? (value === 'no' ? 'border-[#F26F52] bg-[#FFD9D3] text-[#A83F31]' : 'border-[#27304C] bg-[#27304C] text-[#FFF7E8]') : 'border-[#D9D7D0] text-[#737789] hover:border-[#27304C] hover:text-[#27304C]'}`}><VoteIcon size={15} />{label}</button>;
                  })}
                </div>
              </div>
              {index === 0 && <p className="mt-3 pl-[60px] text-xs font-semibold text-[#F26F52]">the group’s current front-runner</p>}
            </article>;
          })}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#D9D7D0] bg-[#F0EDE1] p-4 sm:flex-row sm:p-5">
          <p className="text-sm text-[#696D7E]"><strong className="text-[#27304C]">One vote each.</strong> No lobbying, promise.</p>
          <Button onClick={next} disabled={!votedCount} testId="button-settle-plan" className="w-full sm:w-auto">Settle the plan <Sparkles size={17} /></Button>
        </div>
      </main>
    </Shell>
  );
}

function FinalPage({ votes, restart }: { votes: Record<string, Vote>; restart: () => void }) {
  const winner = useMemo(() => {
    const ranked = plans.map((plan, index) => ({ plan, score: votes[plan.id] === 'love' ? 3 : votes[plan.id] === 'works' ? 2 : 1, index })).sort((a, b) => b.score - a.score || a.index - b.index);
    return ranked[0].plan;
  }, [votes]);
  const Icon = winner.icon;
  const pieces = Array.from({ length: 28 }, (_, index) => index);
  return (
    <Shell step={4} onHome={restart}>
      <main className="page-in relative mx-auto flex min-h-[calc(100dvh-82px)] max-w-3xl flex-col items-center px-5 pb-16 pt-10 text-center sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[390px] overflow-hidden" aria-hidden="true">{pieces.map((piece) => <span key={piece} className="confetti-piece absolute top-[-20px] h-3 w-1.5 rounded-full" style={{ left: `${(piece * 37) % 100}%`, backgroundColor: ['#F26F52', '#27304C', '#FFE48B', '#37A28C', '#C9C8FF'][piece % 5], transform: `rotate(${piece * 31}deg)`, animationDuration: `${2.1 + (piece % 5) * .22}s` }} />)}</div>
        <div className="rise-in relative z-10 grid h-20 w-20 place-items-center rounded-[28px] border-2 border-[#27304C] bg-[#FFE48B] text-[#27304C] shadow-[5px_5px_0_#F26F52]"><Crown size={39} strokeWidth={1.8} /></div>
        <p className="relative z-10 mt-8 font-mono text-[11px] font-medium uppercase tracking-[.22em] text-[#F26F52]">the group has spoken</p>
        <h1 className="font-display relative z-10 mt-3 text-6xl font-bold leading-[.85] tracking-[-.09em] text-[#27304C] sm:text-8xl">IT’S<br /><span className="text-[#F26F52]">SETTLED!</span></h1>
        <p className="relative z-10 mt-7 max-w-md text-lg leading-7 text-[#666A7D]">No more “you decide.” The next good memory is officially on the calendar.</p>
        <div className="rise-in relative z-10 mt-9 w-full max-w-md rounded-3xl border-2 border-[#27304C] bg-[#FFF7E8] p-5 text-left shadow-[7px_7px_0_#27304C] sm:p-6" style={{ animationDelay: '.15s' }} data-testid="final-winning-plan">
          <div className="flex items-center gap-4"><div className={`grid h-16 w-16 place-items-center rounded-2xl ${winner.color} text-[#27304C]`}><Icon size={29} /></div><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#F26F52]">winning plan</p><h2 className="font-display text-2xl font-bold tracking-[-.05em] text-[#27304C]">{winner.name}</h2><p className="mt-0.5 text-sm text-[#74788A]">{winner.detail}</p></div></div>
          <div className="my-5 h-px bg-[#D9D7D0]" />
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-[#27304C]"><CheckCircle2 size={18} className="text-[#37A28C]" /> 4/4 friends are in</span><span className="font-mono text-xs font-medium text-[#F26F52]">{winner.match}% match</span></div>
        </div>
        <Button onClick={restart} variant="secondary" testId="button-start-over" className="relative z-10 mt-10"><RotateCcw size={16} /> start a new plan</Button>
      </main>
    </Shell>
  );
}

function NotFoundPage({ goHome }: { goHome: () => void }) {
  return <Shell onHome={goHome}><main className="mx-auto max-w-xl px-5 py-24 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FFD9D3] text-[#F26F52]"><MapPin /></div><h1 className="font-display mt-6 text-4xl font-bold text-[#27304C]">This plan wandered off.</h1><p className="mt-3 text-[#6A6E80]">Let’s get you back to a decision.</p><Button onClick={goHome} testId="button-not-found-home" className="mt-7">Back to PlanJam <ArrowRight size={17} /></Button></main></Shell>;
}

function Router() {
  const [location, setLocation] = useLocation();
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences);
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const go = (path: string) => setLocation(path);
  const restart = () => {
    setPrefs(initialPreferences);
    setVotes({});
    go('/');
  };
  return (
    <>
      {location === '/' && <HomePage start={() => go('/preferences')} />}
      {location === '/preferences' && <PreferencesPage prefs={prefs} setPrefs={setPrefs} next={() => go('/results')} back={() => go('/')} />}
      {location === '/results' && <ResultsPage prefs={prefs} next={() => go('/vote')} back={() => go('/preferences')} />}
      {location === '/vote' && <VotePage votes={votes} setVotes={setVotes} next={() => go('/final')} back={() => go('/results')} />}
      {location === '/final' && <FinalPage votes={votes} restart={restart} />}
      {!['/', '/preferences', '/results', '/vote', '/final'].includes(location) && <NotFoundPage goHome={() => go('/')} />}
    </>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;