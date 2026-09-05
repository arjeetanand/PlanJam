import { createHash } from "node:crypto";

type Activity = "food" | "movie" | "games" | "outdoors" | "chill" | "party";
type HardNo = "crowds" | "long-drives" | "loud-venues" | "spicy-food" | "late-nights";
type Budget = "500" | "1000" | "1500" | "2000-plus";
type Distance = "nearby" | "5km" | "10km" | "anywhere";

export type VenueSearchPreferences = {
  activity: Activity;
  budget: Budget;
  distance: Distance;
  hardNos: HardNo[];
};

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

  const activity = dominantActivity(preferences);
  const radius = radiusFor(preferences);
  const cacheKey = createHash("sha256")
    .update(`${lat.toFixed(3)}:${lng.toFixed(3)}:${activity}:${radius}:${preferences.map((p) => `${p.budget}:${p.hardNos.sort().join(",")}`).sort().join("|")}`)
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
    if (!nearbyResponse.ok) return { status: "fallback-provider-unavailable", plans: [] };
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
      if (!textResponse.ok) return { status: "fallback-provider-unavailable", plans: [] };
      data = await textResponse.json() as { places?: GooglePlace[] };
    }

    const plans = (data.places ?? []).flatMap((place): VenuePlan[] => {
      const placeLat = place.location?.latitude;
      const placeLng = place.location?.longitude;
      const mapsUrl = safeMapsUrl(place);
      if (!place.id || !place.displayName?.text || placeLat === undefined || placeLng === undefined || !mapsUrl) return [];
      const meters = distanceMeters(lat, lng, placeLat, placeLng);
      if (meters > radius) return [];
      const placeBudget = PRICE_LEVEL[place.priceLevel ?? ""] ?? preferences[0].budget;
      const activityMatches = preferences.filter((preference) => preference.activity === activity).length;
      const budgetMatches = preferences.filter((preference) => preference.budget === placeBudget).length;
      const distanceMatches = preferences.filter((preference) => {
        const max = { nearby: 2000, "5km": 5000, "10km": 10000, anywhere: 20000 }[preference.distance];
        return meters <= max;
      }).length;
      const ratingBonus = place.rating ? Math.min(10, Math.round(place.rating * 2)) : 0;
      const score = Math.min(99, Math.round(((activityMatches * 3 + budgetMatches + distanceMatches) / (preferences.length * 5)) * 90) + ratingBonus);
      const reasons = [
        activityMatches ? `matches ${activityMatches === preferences.length ? "everyone's" : "the group's"} activity pick` : "",
        distanceMatches === preferences.length ? "within everyone's distance" : `${Math.max(1, Math.round(meters / 100) / 10)} km away`,
        place.rating ? `${place.rating.toFixed(1)} rating` : "",
      ].filter(Boolean).slice(0, 2);
      return [{
        id: `venue-google-${place.id}`,
        name: place.displayName.text,
        detail: place.primaryTypeDisplayName?.text ?? activity,
        category: activity,
        budget: placeBudget,
        distance: meters <= 2000 ? "nearby" : meters <= 5000 ? "5km" : meters <= 10000 ? "10km" : "anywhere",
        matchPercent: score,
        reasons,
        venue: {
          category: place.primaryTypeDisplayName?.text ?? activity,
          address: place.formattedAddress ?? "Address available in Maps",
          distanceMeters: meters,
          ...(place.rating === undefined ? {} : { rating: place.rating }),
          ...(place.currentOpeningHours?.openNow === undefined ? {} : { openNow: place.currentOpeningHours.openNow }),
          mapsUrl,
        },
      }];
    }).sort((a, b) => b.matchPercent - a.matchPercent || a.id.localeCompare(b.id)).slice(0, 3);

    if (!plans.length) return { status: "fallback-no-results", plans: [] };
    cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, plans });
    return { status: "nearby-results", plans };
  } catch {
    return { status: "fallback-provider-unavailable", plans: [] };
  } finally {
    clearTimeout(timeout);
  }
}