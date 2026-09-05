import { Utensils, Film, Gamepad2, Sun, Waves, PartyPopper, type LucideIcon } from 'lucide-react';
import type { PreferenceInputActivity, PreferenceInputBudget, PreferenceInputDistance, PreferenceInputHardNosItem } from '@workspace/api-client-react';

export const steps = [
  { number: '01', label: 'Pick your vibe' },
  { number: '02', label: 'Find the overlap' },
  { number: '03', label: 'Vote it in' },
  { number: '04', label: 'Make it real' },
];

export const activityOptions: { label: string; value: PreferenceInputActivity; sub: string; icon: LucideIcon; tint: string }[] = [
  { label: 'Food', value: 'food', sub: 'something delicious', icon: Utensils, tint: 'bg-[#FFE6B7]' },
  { label: 'Movie', value: 'movie', sub: 'big screen energy', icon: Film, tint: 'bg-[#DCE8FF]' },
  { label: 'Games', value: 'games', sub: 'friendly competition', icon: Gamepad2, tint: 'bg-[#DBF1E6]' },
  { label: 'Outdoors', value: 'outdoors', sub: 'touch some grass', icon: Sun, tint: 'bg-[#FFF1A9]' },
  { label: 'Chill', value: 'chill', sub: 'low-key is the key', icon: Waves, tint: 'bg-[#E0E1FF]' },
  { label: 'Party', value: 'party', sub: 'make a little noise', icon: PartyPopper, tint: 'bg-[#FFD9D3]' },
];

export const budgetOptions: { label: string; value: PreferenceInputBudget }[] = [
  { label: '₹500', value: '500' },
  { label: '₹1000', value: '1000' },
  { label: '₹1500', value: '1500' },
  { label: '₹2000+', value: '2000-plus' },
];

export const distanceOptions: { label: string; value: PreferenceInputDistance }[] = [
  { label: 'Nearby', value: 'nearby' },
  { label: '5 km', value: '5km' },
  { label: '10 km', value: '10km' },
  { label: 'Anywhere', value: 'anywhere' },
];

export const noOptions: { label: string; value: PreferenceInputHardNosItem }[] = [
  { label: 'Crowds', value: 'crowds' },
  { label: 'Long drives', value: 'long-drives' },
  { label: 'Loud venues', value: 'loud-venues' },
  { label: 'Spicy food', value: 'spicy-food' },
  { label: 'Late nights', value: 'late-nights' },
];
