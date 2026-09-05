export type Activity = "food" | "movie" | "games" | "outdoors" | "chill" | "party";
export type HardNo = "crowds" | "long-drives" | "loud-venues" | "spicy-food" | "late-nights";
export type Budget = "500" | "1000" | "1500" | "2000-plus";
export type Distance = "nearby" | "5km" | "10km" | "anywhere";
export type PreferenceInput = { activity: Activity; budget: Budget; distance: Distance; hardNos: HardNo[] };

const budgetAmount: Record<Budget, number> = { "500": 500, "1000": 1000, "1500": 1500, "2000-plus": 2000 };
const distanceAmount: Record<Distance, number> = { nearby: 2000, "5km": 5000, "10km": 10000, anywhere: 20000 };

type GroupProfile = {
  activityCounts: Map<Activity, number>;
  budgetCounts: Map<Budget, number>;
  distanceCounts: Map<Distance, number>;
  majorityActivity: Activity;
  majorityBudget: Budget;
  majorityDistance: Distance;
  totalWeight: number;
};

function counts<T extends string>(values: T[]): Map<T, number> {
  return values.reduce((result, value) => result.set(value, (result.get(value) ?? 0) + 1), new Map<T, number>());
}

function majority<T extends string>(values: T[], countMap: Map<T, number>): T {
  return [...countMap.keys()].sort((a, b) => (countMap.get(b)! - countMap.get(a)!) || a.localeCompare(b))[0] ?? values[0];
}

export function groupProfile(preferences: PreferenceInput[]): GroupProfile {
  const activityCounts = counts(preferences.map((preference) => preference.activity));
  const budgetCounts = counts(preferences.map((preference) => preference.budget));
  const distanceCounts = counts(preferences.map((preference) => preference.distance));
  const totalWeight = preferences.reduce((total, preference) => total + 1 + (activityCounts.get(preference.activity)! / preferences.length), 0);
  return {
    activityCounts,
    budgetCounts,
    distanceCounts,
    majorityActivity: majority(preferences.map((preference) => preference.activity), activityCounts),
    majorityBudget: majority(preferences.map((preference) => preference.budget), budgetCounts),
    majorityDistance: majority(preferences.map((preference) => preference.distance), distanceCounts),
    totalWeight,
  };
}

function preferenceWeight(value: string, profile: GroupProfile, dimension: "activity" | "budget" | "distance"): number {
  const map: Map<string, number> = dimension === "activity" ? profile.activityCounts : dimension === "budget" ? profile.budgetCounts : profile.distanceCounts;
  return 1 + ((map.get(value) ?? 0) / Math.max(1, [...map.values()].reduce((sum, count) => sum + count, 0)));
}

function weightedExact<T extends string>(
  preferences: PreferenceInput[],
  profile: GroupProfile,
  dimension: "activity" | "budget" | "distance",
  candidate: T,
): number {
  const matches = preferences.reduce((total, preference) => {
    const value = preference[dimension] as T;
    return total + (value === candidate ? preferenceWeight(value, profile, dimension) : 0);
  }, 0);
  const total = preferences.reduce((sum, preference) => sum + preferenceWeight(preference[dimension], profile, dimension), 0);
  return total ? matches / total : 0;
}

function budgetFit(candidate: Budget | undefined, preference: Budget): number {
  if (!candidate) return 0.55;
  const candidateAmount = budgetAmount[candidate];
  const limit = budgetAmount[preference];
  if (candidateAmount > limit) return 0;
  return candidateAmount === limit ? 1 : 0.85;
}

function distanceFit(candidateMeters: number, preference: Distance): number {
  const limit = distanceAmount[preference];
  if (candidateMeters <= limit) return 1;
  return Math.max(0, Math.min(0.65, limit / candidateMeters * 0.65));
}

export function hasCatalogHardNoConflict(planTraits: HardNo[], preferences: PreferenceInput[]): boolean {
  const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
  return planTraits.some((trait) => hardNos.has(trait));
}

export function hasVenueHardNoConflict(
  activity: Activity,
  providerCategory: string,
  placeName: string,
  distanceMeters: number,
  preferences: PreferenceInput[],
): boolean {
  const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
  const searchable = `${activity} ${providerCategory} ${placeName}`.toLowerCase();
  if (hardNos.has("long-drives") && distanceMeters > distanceAmount["5km"]) return true;
  if (hardNos.has("spicy-food") && activity === "food" && !/(cafe|bakery|tea|dessert|ice cream)/i.test(searchable)) return true;
  if (hardNos.has("loud-venues") && /(bar|club|karaoke|arcade|bowling|live music|concert|amusement|nightlife)/i.test(searchable)) return true;
  if (hardNos.has("crowds") && /(stadium|club|bar|arcade|bowling|amusement|mall|concert|festival|nightlife)/i.test(searchable)) return true;
  if (hardNos.has("late-nights") && /(bar|club|karaoke|night|nightlife|concert)/i.test(searchable)) return true;
  return false;
}

export function scoreGroupMatch(
  candidate: { activity: Activity; budget?: Budget; distanceMeters: number },
  preferences: PreferenceInput[],
): { matchPercent: number; reasons: string[] } {
  const profile = groupProfile(preferences);
  const activityScore = weightedExact(preferences, profile, "activity", candidate.activity);
  const budgetScore = preferences.reduce((sum, preference) => sum + preferenceWeight(preference.budget, profile, "budget") * budgetFit(candidate.budget, preference.budget), 0)
    / Math.max(1, preferences.reduce((sum, preference) => sum + preferenceWeight(preference.budget, profile, "budget"), 0));
  const distanceScore = preferences.reduce((sum, preference) => sum + preferenceWeight(preference.distance, profile, "distance") * distanceFit(candidate.distanceMeters, preference.distance), 0)
    / Math.max(1, preferences.reduce((sum, preference) => sum + preferenceWeight(preference.distance, profile, "distance"), 0));
  const matchPercent = Math.max(0, Math.min(99, Math.round((activityScore * 3 + budgetScore + distanceScore) * 100 / 5)));

  const reasons: string[] = [];
  if (candidate.activity === profile.majorityActivity) reasons.push("matches the group's most-picked activity");
  else if (preferences.some((preference) => preference.activity === candidate.activity)) reasons.push("keeps a minority activity in the mix");
  const withinEveryoneBudget = preferences.every((preference) => candidate.budget && budgetAmount[candidate.budget] <= budgetAmount[preference.budget]);
  if (withinEveryoneBudget) reasons.push("within everyone's budget");
  else if (candidate.budget === profile.majorityBudget) reasons.push("fits the most common budget");
  else if (candidate.budget && budgetAmount[candidate.budget] < budgetAmount[profile.majorityBudget]) reasons.push("lower-cost compromise");
  const withinEveryoneDistance = preferences.every((preference) => candidate.distanceMeters <= distanceAmount[preference.distance]);
  if (withinEveryoneDistance) reasons.push("within everyone's distance");
  else if (candidate.distanceMeters <= distanceAmount[profile.majorityDistance]) reasons.push("fits the most common distance");
  else reasons.push("distance preference relaxed");
  return { matchPercent, reasons: reasons.slice(0, 2) };
}
