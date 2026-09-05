import { createHash } from "node:crypto";
import {
  groupProfile,
  hasVenueHardNoConflict,
  scoreGroupMatch,
  type Activity,
  type Budget,
  type Distance,
  type PreferenceInput,
} from "./recommendation-scoring";

export type VenueSearchPreferences = PreferenceInput;

export type VenuePlan = {
  id: string;
  name: string;
  detail: string;
  category: Activity;
  budget: Budget;
  distance: Distance;
  matchPercent: number;
  reasons: string[];
  venue: {
    category: string;
    address: string;
    distanceMeters: number;
    rating?: number;
    openNow?: boolean;
    mapsUrl: string;
  };
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryTypeDisplayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  currentOpeningHours?: { openNow?: boolean };
  googleMapsUri?: string;
  priceLevel?: string;
};

const ACTIVITY_TYPES: Record<Activity, string[]> = {
  food: ["restaurant", "cafe"],
  movie: ["movie_theater"],
  games: ["amusement_center", "bowling_alley"],
  outdoors: ["park", "hiking_area"],
  chill: ["cafe", "spa"],
  party: ["night_club", "bar"],
};

const ACTIVITY_QUERIES: Record<Activity, string> = {
  food: "restaurants and cafes",
  movie: "cinemas and movie theaters",
  games: "arcades bowling and game cafes",
  outdoors: "parks trails and outdoor activities",
  chill: "cafes spas and relaxing places",
  party: "bars clubs and live music venues",
};

function placeTypesFor(activity: Activity, preferences: VenueSearchPreferences[]): string[] {
  const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
  if (activity === "food" && hardNos.has("spicy-food")) return ["cafe", "bakery"];
  return ACTIVITY_TYPES[activity];
}

const PRICE_LEVEL: Record<string, Budget> = {
  PRICE_LEVEL_FREE: "500",
  PRICE_LEVEL_INEXPENSIVE: "500",
  PRICE_LEVEL_MODERATE: "1000",
  PRICE_LEVEL_EXPENSIVE: "1500",
  PRICE_LEVEL_VERY_EXPENSIVE: "2000-plus",
};

const cache = new Map<string, { expires: number; plans: VenuePlan[] }>();
const CACHE_TTL_MS = 10 * 60_000;
const MAX_RESULTS = 8;

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function radiusFor(preferences: VenueSearchPreferences[]): number {
  const radii: Record<Distance, number> = { nearby: 2000, "5km": 5000, "10km": 10000, anywhere: 20000 };
  return Math.min(20_000, Math.max(...preferences.map((preference) => radii[preference.distance])));
}

function dominantActivity(preferences: VenueSearchPreferences[]): Activity {
  const counts = new Map<Activity, number>();
  for (const preference of preferences) counts.set(preference.activity, (counts.get(preference.activity) ?? 0) + 1);
  const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
  const allowed = ([...counts.entries()] as [Activity, number][]).filter(([activity]) => {
    if (activity === "party" && (hardNos.has("crowds") || hardNos.has("loud-venues") || hardNos.has("late-nights"))) return false;
    if (activity === "games" && (hardNos.has("crowds") || hardNos.has("loud-venues"))) return false;
    return true;
  });
  return (allowed.length ? allowed : [["chill", 0] as [Activity, number]])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function activityCandidates(preferences: VenueSearchPreferences[]): Activity[] {
  const counts = new Map<Activity, number>();
  for (const preference of preferences) counts.set(preference.activity, (counts.get(preference.activity) ?? 0) + 1);
  const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
  return [...counts.entries()]
    .filter(([activity]) => {
      if (activity === "party" && (hardNos.has("crowds") || hardNos.has("loud-venues") || hardNos.has("late-nights"))) return false;
      if (activity === "games" && (hardNos.has("crowds") || hardNos.has("loud-venues"))) return false;
      return true;
    })
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([activity]) => activity)
    .slice(0, 3);
}

function safeMapsUrl(place: GooglePlace): string | undefined {
  if (place.googleMapsUri?.startsWith("https://www.google.com/maps/")) return place.googleMapsUri;
  if (!place.id) return undefined;
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}`;
}

export async function searchNearbyVenues(
  lat: number,
  lng: number,
  preferences: VenueSearchPreferences[],
): Promise<{ status: "nearby-results" | "fallback-provider-unavailable" | "fallback-no-results"; plans: VenuePlan[] }> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { status: "fallback-provider-unavailable", plans: [] };

  const activities = activityCandidates(preferences);
  const fallbackActivity = activities[0] ?? dominantActivity(preferences);
  const radius = radiusFor(preferences);
  const cacheKey = createHash("sha256")
    .update(`${lat.toFixed(3)}:${lng.toFixed(3)}:${activities.join(",")}:${radius}:${preferences.map((p) => `${p.activity}:${p.budget}:${p.hardNos.sort().join(",")}`).sort().join("|")}`)
    .digest("hex");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return { status: "nearby-results", plans: cached.plans };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.location,places.rating,places.currentOpeningHours.openNow,places.googleMapsUri,places.priceLevel",
    };
    const places: { activity: Activity; place: GooglePlace }[] = [];
    let providerFailed = false;
    for (const activity of activities.length ? activities : [fallbackActivity]) {
      const nearbyResponse = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          includedPrimaryTypes: placeTypesFor(activity, preferences),
          maxResultCount: MAX_RESULTS,
          rankPreference: "POPULARITY",
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
        }),
      });
      if (!nearbyResponse.ok) {
        providerFailed = true;
        continue;
      }
      let data = await nearbyResponse.json() as { places?: GooglePlace[] };

      if (!data.places?.length) {
        const hardNos = new Set(preferences.flatMap((preference) => preference.hardNos));
        const textQuery = activity === "food" && hardNos.has("spicy-food")
          ? "cafes and bakeries"
          : ACTIVITY_QUERIES[activity];
        const textResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          signal: controller.signal,
          headers,
          body: JSON.stringify({
            textQuery,
            maxResultCount: MAX_RESULTS,
            rankPreference: "DISTANCE",
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          }),
        });
        if (!textResponse.ok) {
          providerFailed = true;
          continue;
        }
        data = await textResponse.json() as { places?: GooglePlace[] };
      }
      for (const place of data.places ?? []) places.push({ activity, place });
    }

    const plans = places.flatMap(({ activity, place }): VenuePlan[] => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      const mapsUrl = safeMapsUrl(place);
      if (!place.id || !place.displayName?.text || placeLat === undefined || placeLng === undefined || !mapsUrl) return [];
      const meters = distanceMeters(lat, lng, placeLat, placeLng);
      if (meters > radius) return [];
      if (hasVenueHardNoConflict(
        activity,
        place.primaryTypeDisplayName?.text ?? "",
        place.displayName.text,
        meters,
        preferences,
      )) return [];
      const placeBudget = PRICE_LEVEL[place.priceLevel ?? ""] as Budget | undefined;
      const scored = scoreGroupMatch({ activity, budget: placeBudget, distanceMeters: meters }, preferences);
      return [{
        id: `venue-google-${place.id}`,
        name: place.displayName.text,
        detail: place.primaryTypeDisplayName?.text ?? activity,
        category: activity,
        budget: placeBudget ?? groupProfile(preferences).majorityBudget,
        distance: meters <= 2000 ? "nearby" : meters <= 5000 ? "5km" : meters <= 10000 ? "10km" : "anywhere",
        matchPercent: scored.matchPercent,
        reasons: scored.reasons,
        venue: {
          category: place.primaryTypeDisplayName?.text ?? activity,
          address: place.formattedAddress ?? "Address available in Maps",
          distanceMeters: meters,
          ...(place.rating === undefined ? {} : { rating: place.rating }),
          ...(place.currentOpeningHours?.openNow === undefined ? {} : { openNow: place.currentOpeningHours.openNow }),
          mapsUrl,
        },
      }];
    }).sort((a, b) => b.matchPercent - a.matchPercent || a.id.localeCompare(b.id));

    if (!plans.length) return { status: providerFailed ? "fallback-provider-unavailable" : "fallback-no-results", plans: [] };
    const selected: VenuePlan[] = [];
    const categories = [...new Set(plans.map((plan) => plan.category))];
    for (const category of categories) {
      const plan = plans.find((candidate) => candidate.category === category);
      if (plan) selected.push(plan);
    }
    for (const plan of plans) {
      if (selected.length >= 3) break;
      if (!selected.some((candidate) => candidate.id === plan.id)) selected.push(plan);
    }
    const result = selected.slice(0, 3);
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, plans: result });
    return { status: "nearby-results", plans: result };
  } catch {
    return { status: "fallback-provider-unavailable", plans: [] };
  } finally {
    clearTimeout(timeout);
  }
}