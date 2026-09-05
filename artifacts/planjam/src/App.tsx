import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Clock3,
  Film,
  Flame,
  Gamepad2,
  Heart,
  MapPin,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  Users,
  WalletCards,
  Waves,
  Zap,
} from 'lucide-react';
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

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

const steps = [
  { number: '01', label: 'Pick your vibe' },
  { number: '02', label: 'Find the overlap' },
  { number: '03', label: 'Vote it in' },
  { number: '04', label: 'Make it real' },
];

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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#F26F52',
    colorForeground: '#27304C',
    colorMutedForeground: '#6A6E80',
    colorDanger: '#A83F31',
    colorBackground: '#FFF7E8',
    colorInput: '#FFFDF5',
    colorInputForeground: '#27304C',
    colorNeutral: '#D9D7D0',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#FFF7E8] rounded-[24px] w-[440px] max-w-full overflow-hidden border-2 border-[#27304C] shadow-[8px_8px_0_#27304C]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!text-[#27304C] !text-3xl !font-bold',
    headerSubtitle: '!text-[#6A6E80]',
    socialButtonsBlockButtonText: '!text-[#27304C] !font-bold',
    formFieldLabel: '!text-[#27304C] !font-bold',
    footerActionLink: '!text-[#F26F52] !font-bold',
    footerActionText: '!text-[#6A6E80]',
    dividerText: '!text-[#8A8D9B]',
    identityPreviewEditButton: '!text-[#F26F52]',
    formFieldSuccessText: '!text-[#277865]',
    alertText: '!text-[#A83F31]',
    logoBox: 'rounded-xl overflow-hidden',
    logoImage: 'object-contain',
    socialButtonsBlockButton: '!border-[#D9D7D0] !bg-[#FFFDF5] !rounded-xl',
    formButtonPrimary: '!bg-[#F26F52] !text-[#FFF7E8] !font-bold !rounded-full !shadow-none',
    formFieldInput: '!bg-[#FFFDF5] !border-[#D9D7D0] !text-[#27304C] !rounded-xl',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#D9D7D0]',
    alert: '!bg-[#FFD9D3] !border-[#F26F52]',
    otpCodeFieldInput: '!bg-[#FFFDF5] !border-[#D9D7D0] !text-[#27304C]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
} as const;

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
      <div className="flex items-center gap-3 sm:gap-5">
        {step ? (
          <div className="flex items-center gap-3" data-testid="status-progress">
            <span className="hidden font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#7C7F91] sm:block">{steps[step - 1].label}</span>
            <div className="flex gap-1.5" aria-label={`Step ${step} of 4`}>
              {steps.map((item) => (
                <span key={item.number} className={`h-1.5 w-7 overflow-hidden rounded-full transition-colors duration-300 sm:w-10 ${Number(item.number) <= step ? 'bg-[#F26F52]' : 'bg-[#DBD8CC]'}`} />
              ))}
            </div>
            <span className="font-mono text-[11px] font-medium text-[#F26F52]">{String(step).padStart(2, '0')}/04</span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 text-xs font-semibold text-[#7C7F91] sm:flex">
            <Users size={15} /> made for the group chat
          </div>
        )}
        <AccountControl />
      </div>
    </header>
  );
}

function AccountControl() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return <span className="hidden h-9 w-20 animate-pulse rounded-full bg-[#E8E3D2] sm:block" aria-label="Loading account" />;
  }

  if (isSignedIn) {
    const displayName = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'friend';
    return (
      <div className="flex items-center gap-2 rounded-full border border-[#D9D7D0] bg-[#FFF7E8]/80 py-1 pl-2 pr-1.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#B7DBD7] text-[10px] font-bold uppercase text-[#27304C]">
          {displayName.slice(0, 1)}
        </span>
        <span className="hidden max-w-24 truncate text-xs font-bold text-[#27304C] sm:block">{displayName}</span>
        <button
          type="button"
          onClick={() => void signOut({ redirectUrl: basePath || '/' })}
          className="rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[#6A6E80] transition-colors hover:bg-[#FFD9D3] hover:text-[#A83F31]"
          data-testid="button-sign-out"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <a href={`${basePath}/sign-in`} className="rounded-full px-2.5 py-2 text-xs font-bold text-[#6A6E80] transition-colors hover:text-[#F26F52]" data-testid="link-sign-in">
        Sign in
      </a>
      <a href={`${basePath}/sign-up`} className="rounded-full bg-[#27304C] px-3.5 py-2 text-xs font-bold text-[#FFF7E8] shadow-[2px_2px_0_#F26F52] transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">
        Join the crew
      </a>
    </div>
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
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button onClick={start} testId="button-start-planning" className="px-7 py-4 text-base">
              Find our plan <ArrowRight size={18} strokeWidth={2.5} />
            </Button>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[.12em] text-[#8A8D9B]"><Clock3 size={13} /> takes 60 seconds</span>
          </div>
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
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionTitle eyebrow="01 / your vibe" title="What sounds good?" body="Start with your gut. A few quick picks give the group something to work with." />
          <span className="hidden shrink-0 rounded-full border border-[#D9D7D0] bg-[#FFF7E8]/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#7C7F91] sm:inline-flex">about 15 sec</span>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-[-.04em] text-[#27304C]">Choose a starting point</h2>
          <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#8A8D9B]"><Check size={13} className="mr-1 inline text-[#37A28C]" /> required</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activityOptions.map(({ label, sub, icon: Icon, tint }) => {
            const selected = prefs.activity === label;
            return (
              <button type="button" aria-pressed={selected} key={label} onClick={() => setPrefs({ ...prefs, activity: label })} data-testid={`option-activity-${label.toLowerCase()}`} className={`group relative min-h-[130px] rounded-2xl border-2 p-4 text-left transition-all duration-200 ${selected ? 'border-[#27304C] bg-[#FFF7E8] shadow-[4px_4px_0_#27304C] -translate-y-1' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 hover:-translate-y-0.5 hover:border-[#A8A8B1]'}`}>
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
            <p className="mb-4 text-xs text-[#828596]">Keep the plan comfortable for everyone.</p>
            <div className="grid grid-cols-2 gap-2">
              {budgetOptions.map((item) => <button type="button" aria-pressed={prefs.budget === item} key={item} onClick={() => setPrefs({ ...prefs, budget: item })} data-testid={`option-budget-${item.replace(/\W/g, '')}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.budget === item ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item}</button>)}
            </div>
          </div>
          <div>
            <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Compass size={19} className="text-[#F26F52]" /> how far are we going?</h2>
            <p className="mb-4 text-xs text-[#828596]">Less travel, more actual hanging out.</p>
            <div className="grid grid-cols-2 gap-2">
              {distanceOptions.map((item) => <button type="button" aria-pressed={prefs.distance === item} key={item} onClick={() => setPrefs({ ...prefs, distance: item })} data-testid={`option-distance-${item.replace(/\W/g, '')}`} className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${prefs.distance === item ? 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[3px_3px_0_#B7DBD7]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#5E6377] hover:border-[#27304C]'}`}>{item}</button>)}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#D9D7D0] pt-8">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-[-.04em]"><Ban size={19} className="text-[#F26F52]" /> any hard NOs?</h2>
            <p className="mb-4 mt-1 text-sm text-[#828596]">Protect the peace. Pick as many as you need.</p></div>
            <span className="rounded-full bg-[#F0EDE1] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.1em] text-[#8A8D9B]">optional</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {noOptions.map((item) => {
              const selected = prefs.hardNos.includes(item);
              return <button type="button" aria-pressed={selected} key={item} onClick={() => toggleNo(item)} data-testid={`option-no-${item.toLowerCase().replace(' ', '-')}`} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${selected ? 'border-[#F26F52] bg-[#FFD9D3] text-[#A83F31] shadow-[2px_2px_0_#F26F52]' : 'border-[#D9D7D0] bg-[#FFF7E8]/70 text-[#6A6E80] hover:border-[#F26F52]'}`}>{selected && <Check size={14} className="mr-1 inline" />}{item}</button>;
            })}
          </div>
          <p className="mt-4 text-xs font-semibold text-[#37A28C]"><CheckCircle2 size={14} className="mr-1 inline" /> {prefs.hardNos.length ? `${prefs.hardNos.length} ${prefs.hardNos.length > 1 ? 'boundaries' : 'boundary'} protected` : 'No hard NOs selected — keeping the field wide open'}</p>
        </div>
        <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-[#D9D7D0] pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[.14em] text-[#8A8D9B]">your picks stay on this device</span>
          <Button onClick={next} testId="button-see-common-ground">Show our common ground <ArrowRight size={17} /></Button>
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
            <SectionTitle eyebrow="02 / group sync" title="Look at that overlap." body={`Your ${prefs.activity.toLowerCase()} pick + the crew’s preferences make a very workable ${prefs.distance.toLowerCase()} plan.`} />
            <div className="rounded-3xl border-2 border-[#27304C] bg-[#27304C] p-5 text-[#FFF7E8] shadow-[6px_6px_0_#F26F52]">
              <div className="flex items-center justify-between">
                <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#B7DBD7]">the overlap</p><h2 className="font-display mt-2 text-2xl font-bold tracking-[-.05em]">Good vibes nearby</h2></div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE48B] text-[#27304C]"><Sparkles size={23} /></div>
              </div>
              <div className="my-5 h-px bg-[#545A70]" />
              <div className="space-y-3 text-sm text-[#E9E5D6]">
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> everyone is open to {prefs.activity.toLowerCase()}</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> nobody wants a long commute</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#B7DBD7]" /> under {prefs.budget} feels right</p>
              </div>
              <div className="mt-6 flex items-center gap-2 border-t border-[#545A70] pt-4">
                <div className="flex -space-x-2">{people.map((person) => <span key={person.name} title={person.name} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#27304C] ${person.color} text-[10px] font-bold text-[#27304C]`}>{person.initials}</span>)}</div>
                <span className="ml-1 text-xs text-[#B8BBC8]"><strong className="text-[#FFF7E8]">4/4</strong> people aligned</span>
              </div>
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#F26F52]">the shortlist</p><h2 className="font-display mt-1 text-2xl font-bold tracking-[-.05em] text-[#27304C]">Three ways to make it happen</h2></div><span className="hidden text-xs text-[#8A8D9B] sm:block">ranked by group match</span></div>
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return <article key={plan.id} data-testid={`card-plan-${plan.id}`} className="group rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/85 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#27304C] hover:shadow-[4px_4px_0_#27304C] sm:p-5">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex shrink-0 flex-col items-center gap-2"><span className={`grid h-14 w-14 place-items-center rounded-2xl ${plan.color} text-[#27304C]`}><Icon size={25} /></span><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide ${index === 0 ? 'bg-[#27304C] text-[#FFF7E8]' : 'bg-[#F0EDE1] text-[#8A8D9B]'}`}>#{index + 1}</span></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h3><p className="mt-0.5 text-sm text-[#74788A]">{plan.detail}</p></div><span className="shrink-0 rounded-full bg-[#DBF1E6] px-2.5 py-1 font-mono text-[11px] font-medium text-[#277865]">{plan.match}% match</span></div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E4E0D3]" aria-label={`${plan.match}% match`}><div className={`h-full rounded-full ${index === 0 ? 'bg-[#F26F52]' : 'bg-[#37A28C]'}`} style={{ width: `${plan.match}%` }} /></div>
                      <div className="mt-4 flex flex-wrap gap-1.5">{plan.reasons.map((reason) => <span key={reason} className="rounded-full bg-[#F0EDE1] px-2.5 py-1 text-[11px] font-semibold text-[#65697A]">{reason}</span>)}</div>
                    </div>
                  </div>
                  {index === 0 && <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-[#F26F52]"><Crown size={14} /> strongest match · easiest yes</div>}
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><SectionTitle eyebrow="03 / quick vote" title="Give the group a clear yes." body="No essays, no lobbying. Tap your gut reaction on each finalist and we’ll settle the plan together." /><span className="mb-8 inline-flex items-center gap-2 self-start rounded-full bg-[#FFE48B] px-3 py-2 font-mono text-[10px] uppercase tracking-[.11em] text-[#5D5121] sm:mb-8"><Users size={14} /> your calls · {votedCount}/3</span></div>
        <div className="mb-6 rounded-2xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-4">
          <div className="flex items-center justify-between gap-4 text-xs font-bold text-[#5E6377]"><span>{votedCount === 0 ? 'Start with the one you’d actually show up for.' : votedCount === 3 ? 'All three calls are in. Ready to settle?' : `${3 - votedCount} quick ${3 - votedCount === 1 ? 'call' : 'calls'} left.`}</span><span className="font-mono text-[10px] uppercase tracking-wide text-[#F26F52]">{votedCount}/3 complete</span></div>
          <div className="mt-3 flex gap-1.5">{plans.map((plan) => <div key={plan.id} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${votes[plan.id] ? 'bg-[#37A28C]' : 'bg-[#E4E0D3]'}`} />)}</div>
        </div>
        <div className="space-y-4">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return <article key={plan.id} className={`rounded-2xl border-2 bg-[#FFF7E8] p-4 transition-all sm:p-5 ${votes[plan.id] ? 'border-[#27304C] shadow-[4px_4px_0_#B7DBD7]' : 'border-[#D9D7D0]'}`} data-testid={`vote-card-${plan.id}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={`flex min-w-0 flex-1 items-center gap-3`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${plan.color} text-[#27304C]`}><Icon size={22} /></span><div className="min-w-0"><h2 className="font-display text-xl font-bold tracking-[-.045em] text-[#27304C]">{plan.name}</h2><p className="text-sm text-[#74788A]">{plan.detail}</p></div></div>
                <div className="grid grid-cols-3 gap-2 sm:w-[285px]">
                  {voteLabels.map(({ value, label, icon: VoteIcon }) => {
                    const active = votes[plan.id] === value;
                    return <button type="button" aria-pressed={active} key={value} onClick={() => setVotes({ ...votes, [plan.id]: value })} data-testid={`vote-${value}-${plan.id}`} className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-bold transition-all ${active ? (value === 'no' ? 'border-[#F26F52] bg-[#FFD9D3] text-[#A83F31]' : 'border-[#27304C] bg-[#27304C] text-[#FFF7E8]') : 'border-[#D9D7D0] text-[#737789] hover:border-[#27304C] hover:text-[#27304C]'}`}><VoteIcon size={15} />{label}</button>;
                  })}
                </div>
              </div>
              {index === 0 && <p className="mt-3 pl-[60px] text-xs font-semibold text-[#F26F52]">the group’s current front-runner · make it official?</p>}
            </article>;
          })}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#D9D7D0] bg-[#F0EDE1] p-4 sm:flex-row sm:p-5">
          <p className="text-sm text-[#696D7E]"><strong className="text-[#27304C]">One vote each.</strong> No lobbying, promise.</p>
          <Button onClick={next} disabled={votedCount !== 3} testId="button-settle-plan" className="w-full sm:w-auto">{votedCount === 3 ? 'Settle the plan' : 'Finish your calls'} <Sparkles size={17} /></Button>
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
        <p className="relative z-10 mt-7 max-w-md text-lg leading-7 text-[#666A7D]">Four opinions became one yes. No more “you decide” — the next good memory has a plan.</p>
        <div className="rise-in relative z-10 mt-9 w-full max-w-md rounded-3xl border-2 border-[#27304C] bg-[#FFF7E8] p-5 text-left shadow-[7px_7px_0_#27304C] sm:p-6" style={{ animationDelay: '.15s' }} data-testid="final-winning-plan">
          <div className="flex items-center gap-4"><div className={`grid h-16 w-16 place-items-center rounded-2xl ${winner.color} text-[#27304C]`}><Icon size={29} /></div><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#F26F52]">winning plan</p><h2 className="font-display text-2xl font-bold tracking-[-.05em] text-[#27304C]">{winner.name}</h2><p className="mt-0.5 text-sm text-[#74788A]">{winner.detail}</p></div></div>
          <div className="my-5 h-px bg-[#D9D7D0]" />
           <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-[#27304C]"><CheckCircle2 size={18} className="text-[#37A28C]" /> 4/4 friends are in</span><span className="font-mono text-xs font-medium text-[#F26F52]">{winner.match}% match</span></div>
           <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#DBF1E6] px-3 py-2 text-xs font-semibold text-[#277865]"><Sparkles size={14} /> Send this to the group chat and make it real.</div>
        </div>
         <Button onClick={restart} variant="secondary" testId="button-start-over" className="relative z-10 mt-10"><RotateCcw size={16} /> plan another hang</Button>
      </main>
    </Shell>
  );
}

function NotFoundPage({ goHome }: { goHome: () => void }) {
  return <Shell onHome={goHome}><main className="mx-auto max-w-xl px-5 py-24 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FFD9D3] text-[#F26F52]"><MapPin /></div><h1 className="font-display mt-6 text-4xl font-bold text-[#27304C]">This plan wandered off.</h1><p className="mt-3 text-[#6A6E80]">Let’s get you back to a decision.</p><Button onClick={goHome} testId="button-not-found-home" className="mt-7">Back to PlanJam <ArrowRight size={17} /></Button></main></Shell>;
}

function SignInPage() {
  return (
    <div className="auth-page app-shell flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="auth-page app-shell flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function PublicHomeRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/user-portal');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || isSignedIn) {
    return <div className="app-shell grid min-h-[100dvh] place-items-center"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#7C7F91]">loading your crew space</span></div>;
  }

  return <HomePage start={() => setLocation('/preferences')} />;
}

function UserPortalRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) {
    return <div className="app-shell grid min-h-[100dvh] place-items-center"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#7C7F91]">taking you to PlanJam</span></div>;
  }

  return <HomePage start={() => setLocation('/preferences')} />;
}

function PlanningRoutes() {
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
      {location === '/' && <PublicHomeRoute />}
      {location === '/user-portal' && <UserPortalRoute />}
      {location === '/preferences' && <PreferencesPage prefs={prefs} setPrefs={setPrefs} next={() => go('/results')} back={() => go('/')} />}
      {location === '/results' && <ResultsPage prefs={prefs} next={() => go('/vote')} back={() => go('/preferences')} />}
      {location === '/vote' && <VotePage votes={votes} setVotes={setVotes} next={() => go('/final')} back={() => go('/results')} />}
      {location === '/final' && <FinalPage votes={votes} restart={restart} />}
      {!['/', '/user-portal', '/preferences', '/results', '/vote', '/final'].includes(location) && !location.startsWith('/sign-in') && !location.startsWith('/sign-up') && <NotFoundPage goHome={() => go('/')} />}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={PlanningRoutes} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back, planner',
            subtitle: 'Sign in to keep your crew moving.',
          },
        },
        signUp: {
          start: {
            title: 'Join the crew',
            subtitle: 'Make your next group plan easier.',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Router />
    </ClerkProvider>
  );
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;