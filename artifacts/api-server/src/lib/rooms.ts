import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, participantsTable, preferencesTable, roomsTable, votesTable } from "@workspace/db";

type Activity = "food" | "movie" | "games" | "outdoors" | "chill" | "party";
type HardNo = "crowds" | "long-drives" | "loud-venues" | "spicy-food" | "late-nights";
type Budget = "500" | "1000" | "1500" | "2000-plus";
type Distance = "nearby" | "5km" | "10km" | "anywhere";
type PreferenceInput = { activity: Activity; budget: Budget; distance: Distance; hardNos: HardNo[] };
type VoteValue = "love" | "works" | "no";
type CatalogPlan = { id: string; name: string; detail: string; category: Activity; budget: Budget; distance: Distance; traits: HardNo[] };

const catalog: CatalogPlan[] = [
  { id: "ramen", name: "Cozy Ramen Dinner", detail: "A quiet neighborhood bowl night.", category: "food", budget: "1000", distance: "nearby", traits: ["spicy-food"] },
  { id: "brunch", name: "Sunny Brunch", detail: "Relaxed café plates and conversation.", category: "food", budget: "1500", distance: "5km", traits: [] },
  { id: "indie-film", name: "Indie Film Screening", detail: "A small cinema feature.", category: "movie", budget: "1000", distance: "5km", traits: [] },
  { id: "drive-in", name: "Drive-in Movie", detail: "Classic movies under the stars.", category: "movie", budget: "1500", distance: "10km", traits: ["long-drives", "late-nights"] },
  { id: "board-games", name: "Board Game Café", detail: "Pick a table game and snacks.", category: "games", budget: "1000", distance: "nearby", traits: [] },
  { id: "arcade", name: "Retro Arcade", detail: "Friendly high-score competition.", category: "games", budget: "1500", distance: "5km", traits: ["crowds", "loud-venues"] },
  { id: "picnic", name: "Park Picnic", detail: "Bring snacks for an easy afternoon.", category: "outdoors", budget: "500", distance: "nearby", traits: [] },
  { id: "hike", name: "Scenic Trail Hike", detail: "A day hike with a viewpoint.", category: "outdoors", budget: "500", distance: "10km", traits: ["long-drives"] },
  { id: "tea", name: "Tea House Reset", detail: "A calm tea tasting session.", category: "chill", budget: "1000", distance: "nearby", traits: [] },
  { id: "spa", name: "Spa Afternoon", detail: "Sauna and restorative treatments.", category: "chill", budget: "2000-plus", distance: "5km", traits: [] },
  { id: "karaoke", name: "Private Karaoke", detail: "A bookable room for your group.", category: "party", budget: "1500", distance: "5km", traits: ["loud-venues", "late-nights"] },
  { id: "dance", name: "Dance Night", detail: "A lively local dance floor.", category: "party", budget: "1000", distance: "nearby", traits: ["crowds", "loud-venues", "late-nights"] },
];

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const makeToken = () => randomBytes(24).toString("base64url");
export const makeSlug = () => randomBytes(6).toString("base64url").replace(/[^A-Za-z0-9]/g, "A").slice(0, 8);

export class RoomError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function normalizeDisplayName(name: string): string {
  const normalized = name.trim();
  if (!normalized) throw new RoomError(400, "Participant name cannot be empty");
  return normalized;
}

export async function ensureNameAvailable(roomId: string, name: string): Promise<void> {
  const [existing] = await db.select({ id: participantsTable.id }).from(participantsTable)
    .where(and(eq(participantsTable.roomId, roomId), sql`lower(${participantsTable.name}) = lower(${name})`));
  if (existing) throw new RoomError(409, "That participant name is already in use in this room");
}

export async function requireRoom(slug: string) {
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.slug, slug));
  if (!room) throw new RoomError(404, "Room not found");
  if (room.expiresAt <= new Date()) throw new RoomError(410, "Room has expired");
  return room;
}

export async function participantForToken(roomId: string, token?: string) {
  if (!token) return undefined;
  const [participant] = await db.select().from(participantsTable)
    .where(and(eq(participantsTable.roomId, roomId), eq(participantsTable.tokenHash, hashToken(token))));
  return participant;
}

function recommendations(prefs: PreferenceInput[]) {
  return catalog
    .filter((plan) => prefs.every((preference) => preference.hardNos.every((hardNo) => !plan.traits.includes(hardNo))))
    .map((plan) => {
      let score = 0;
      const reasons: string[] = [];
      for (const preference of prefs) {
        if (preference.activity === plan.category) { score += 3; reasons.push("matches an activity preference"); }
        if (preference.budget === plan.budget) { score += 1; reasons.push("fits the group budget"); }
        if (preference.distance === plan.distance) { score += 1; reasons.push("fits the group distance"); }
      }
      return { id: plan.id, name: plan.name, detail: plan.detail, category: plan.category, budget: plan.budget, distance: plan.distance, matchPercent: Math.round((score / (prefs.length * 5)) * 100), reasons: [...new Set(reasons)].slice(0, 2) };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent || a.id.localeCompare(b.id))
    .slice(0, 3);
}

export async function roomState(room: typeof roomsTable.$inferSelect, participantToken?: string, hostToken?: string) {
  const participants = await db.select().from(participantsTable).where(eq(participantsTable.roomId, room.id));
  const preferences = participants.length ? await db.select().from(preferencesTable).where(inArray(preferencesTable.participantId, participants.map((p) => p.id))) : [];
  const votes = participants.length ? await db.select().from(votesTable).where(inArray(votesTable.participantId, participants.map((p) => p.id))) : [];
  const scoredPlans = recommendations(preferences as PreferenceInput[]);
  const shortlist = room.shortlist.map((id) => {
    const scored = scoredPlans.find((plan) => plan.id === id);
    if (scored) return scored;
    const plan = catalog.find((candidate) => candidate.id === id);
    return plan ? { id: plan.id, name: plan.name, detail: plan.detail, category: plan.category, budget: plan.budget, distance: plan.distance, matchPercent: 0, reasons: [] } : undefined;
  }).filter((plan): plan is NonNullable<typeof plan> => !!plan);
  const voteTotals = shortlist.map((plan) => {
    const values = votes.filter((vote) => vote.planId === plan.id).map((vote) => vote.vote);
    const love = values.filter((value) => value === "love").length;
    const works = values.filter((value) => value === "works").length;
    const no = values.filter((value) => value === "no").length;
    return { planId: plan.id, love, works, no, score: love * 2 + works - no * 2 };
  });
  const viewer = await participantForToken(room.id, participantToken);
  const isHost = !!hostToken && hashToken(hostToken) === room.hostTokenHash;
  const winner = room.phase === "final" && voteTotals.length
    ? [...voteTotals].sort((a, b) => b.score - a.score || a.planId.localeCompare(b.planId))[0].planId
    : null;
  return {
    slug: room.slug, phase: room.phase, expiresAt: room.expiresAt,
    participants: participants.map((p) => ({ id: p.id, name: p.name, preferencesSubmitted: preferences.some((pref) => pref.participantId === p.id), votesSubmitted: room.shortlist.length > 0 && votes.filter((vote) => vote.participantId === p.id).length === room.shortlist.length })),
    shortlist, voteTotals, winner, viewerParticipantId: viewer?.id ?? null, isHost: isHost || null,
    viewerPreferences: viewer ? preferences.find((pref) => pref.participantId === viewer.id) ?? null : null,
    viewerVotes: viewer ? Object.fromEntries(votes.filter((vote) => vote.participantId === viewer.id).map((vote) => [vote.planId, vote.vote])) : {},
  };
}

export async function createRoom(name: string, clerkUserId?: string) {
  name = normalizeDisplayName(name);
  const hostToken = makeToken(); const participantToken = makeToken();
  let room;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      [room] = await db.insert(roomsTable).values({ slug: makeSlug(), hostTokenHash: hashToken(hostToken), expiresAt: new Date(Date.now() + 86400000) }).returning();
      break;
    } catch { if (attempt === 2) throw new RoomError(409, "Could not allocate room"); }
  }
  if (!room) throw new RoomError(409, "Could not allocate room");
  await db.insert(participantsTable).values({ roomId: room.id, name, tokenHash: hashToken(participantToken), clerkUserId });
  return { ...(await roomState(room, participantToken, hostToken)), hostToken, participantToken };
}

export async function joinRoom(slug: string, displayName: string) {
  const name = normalizeDisplayName(displayName);
  const joined = await db.transaction(async (tx) => {
    const [candidate] = await tx.select().from(roomsTable).where(eq(roomsTable.slug, slug));
    if (!candidate) throw new RoomError(404, "Room not found");
    await tx.execute(sql`select id from ${roomsTable} where id = ${candidate.id} for update`);
    const [room] = await tx.select().from(roomsTable).where(eq(roomsTable.id, candidate.id));
    if (!room) throw new RoomError(404, "Room not found");
    if (room.expiresAt <= new Date()) throw new RoomError(410, "Room has expired");
    if (room.phase !== "preferences") throw new RoomError(409, "Joining is only allowed while preferences are open");
    const members = await tx.select().from(participantsTable).where(eq(participantsTable.roomId, room.id));
    if (members.length >= 4) throw new RoomError(409, "Room is full");
    const [existing] = await tx.select({ id: participantsTable.id }).from(participantsTable)
      .where(and(eq(participantsTable.roomId, room.id), sql`lower(${participantsTable.name}) = lower(${name})`));
    if (existing) throw new RoomError(409, "That participant name is already in use in this room");
    const participantToken = makeToken();
    await tx.insert(participantsTable).values({ roomId: room.id, name, tokenHash: hashToken(participantToken) });
    return { room, participantToken };
  });
  return { ...(await roomState(joined.room, joined.participantToken)), participantToken: joined.participantToken };
}

export async function savePreferences(room: typeof roomsTable.$inferSelect, token: string | undefined, input: PreferenceInput) {
  if (!token) throw new RoomError(403, "Valid participant token required");
  const lockedRoom = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${roomsTable} where id = ${room.id} for update`);
    const [currentRoom] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.id));
    if (!currentRoom) throw new RoomError(404, "Room not found");
    if (currentRoom.expiresAt <= new Date()) throw new RoomError(410, "Room has expired");
    if (currentRoom.phase !== "preferences") throw new RoomError(409, "Preferences are closed");
    const [participant] = await tx.select().from(participantsTable)
      .where(and(eq(participantsTable.roomId, currentRoom.id), eq(participantsTable.tokenHash, hashToken(token))));
    if (!participant) throw new RoomError(403, "Valid participant token required");
    await tx.insert(preferencesTable).values({ participantId: participant.id, ...input })
      .onConflictDoUpdate({ target: preferencesTable.participantId, set: { ...input, updatedAt: new Date() } });
    return currentRoom;
  });
  return roomState(lockedRoom, token);
}

export async function saveVotes(room: typeof roomsTable.$inferSelect, token: string | undefined, values: Record<string, VoteValue>) {
  if (!token) throw new RoomError(403, "Valid participant token required");
  const lockedRoom = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${roomsTable} where id = ${room.id} for update`);
    const [currentRoom] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.id));
    if (!currentRoom) throw new RoomError(404, "Room not found");
    if (currentRoom.expiresAt <= new Date()) throw new RoomError(410, "Room has expired");
    if (currentRoom.phase !== "voting") throw new RoomError(409, "Voting is not open");
    const [participant] = await tx.select().from(participantsTable)
      .where(and(eq(participantsTable.roomId, currentRoom.id), eq(participantsTable.tokenHash, hashToken(token))));
    if (!participant) throw new RoomError(403, "Valid participant token required");
    const ids = Object.keys(values);
    if (ids.length !== currentRoom.shortlist.length || ids.some((id) => !currentRoom.shortlist.includes(id))) {
      throw new RoomError(400, "Submit one vote for every shortlisted plan");
    }
    await tx.delete(votesTable).where(eq(votesTable.participantId, participant.id));
    await tx.insert(votesTable).values(ids.map((planId) => ({ participantId: participant.id, planId, vote: values[planId] })));
    return currentRoom;
  });
  return roomState(lockedRoom, token);
}

export async function advancePhase(room: typeof roomsTable.$inferSelect, hostToken: string | undefined, participantToken: string | undefined, phase: string) {
  if (!hostToken || hashToken(hostToken) !== room.hostTokenHash) throw new RoomError(403, "Valid host token required");
  const updated = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${roomsTable} where id = ${room.id} for update`);
    const [lockedRoom] = await tx.select().from(roomsTable).where(eq(roomsTable.id, room.id));
    if (!lockedRoom) throw new RoomError(404, "Room not found");
    if (lockedRoom.expiresAt <= new Date()) throw new RoomError(410, "Room has expired");
    if (hashToken(hostToken) !== lockedRoom.hostTokenHash) throw new RoomError(403, "Valid host token required");
    const participants = await tx.select().from(participantsTable).where(eq(participantsTable.roomId, lockedRoom.id));
    if (phase === "shortlist") {
      if (lockedRoom.phase !== "preferences") throw new RoomError(409, "Room cannot move to shortlist");
      if (participants.length < 2) throw new RoomError(409, "At least two participants are required");
      const prefs = await tx.select().from(preferencesTable).where(inArray(preferencesTable.participantId, participants.map((p) => p.id)));
      if (prefs.length !== participants.length) throw new RoomError(409, "Everyone must submit preferences");
      const shortlist = recommendations(prefs as PreferenceInput[]);
      if (shortlist.length < 3) throw new RoomError(409, "Fewer than three plans satisfy every hard no");
      const [next] = await tx.update(roomsTable).set({ phase: "shortlist", shortlist: shortlist.map((plan) => plan.id) }).where(eq(roomsTable.id, lockedRoom.id)).returning();
      return next;
    }
    if (phase === "voting") {
      if (lockedRoom.phase !== "shortlist") throw new RoomError(409, "Room cannot move to voting");
    } else if (phase === "final") {
      if (lockedRoom.phase !== "voting") throw new RoomError(409, "Room cannot move to final");
      const votes = await tx.select().from(votesTable).where(inArray(votesTable.participantId, participants.map((p) => p.id)));
      if (votes.length !== participants.length * lockedRoom.shortlist.length) throw new RoomError(409, "Everyone must vote for every plan");
    } else throw new RoomError(400, "Invalid phase");
    const [next] = await tx.update(roomsTable).set({ phase: phase as "voting" | "final" }).where(eq(roomsTable.id, lockedRoom.id)).returning();
    return next;
  });
  return roomState(updated, participantToken, hostToken);
}