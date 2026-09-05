type Selection = {
  activity: string;
  budget: string;
  distance: string;
  hardNos: string[];
};

type Participant = {
  name: string;
  preferencesSubmitted: boolean;
  selection: Selection | null;
};

type RoomState = {
  slug: string;
  phase: "preferences" | "shortlist" | "voting" | "final";
  participants: Participant[];
  shortlist: unknown[];
};

type RoomCredentials = {
  slug: string;
  hostToken: string;
  participantToken: string;
};

const apiOrigin = (process.env.PLANJAM_API_ORIGIN ?? "http://127.0.0.1:8080/api").replace(/\/$/, "");
const marker = Date.now().toString(36);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiOrigin}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep the text response for a useful assertion failure below.
  }
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} returned ${response.status}: ${text}`);
  }
  return body as T;
}

function jsonBody(value: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(value) };
}

function headers(tokens: { participantToken?: string; hostToken?: string } = {}): Record<string, string> {
  return {
    ...(tokens.participantToken ? { "x-participant-token": tokens.participantToken } : {}),
    ...(tokens.hostToken ? { "x-host-token": tokens.hostToken } : {}),
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function participant(state: RoomState, name: string): Participant {
  const match = state.participants.find((candidate) => candidate.name === name);
  assert(match, `Participant ${name} was not present`);
  return match;
}

function assertAllSelections(state: RoomState, expected: Record<string, Selection>): void {
  for (const [name, selection] of Object.entries(expected)) {
    const current = participant(state, name).selection;
    assert(JSON.stringify(current) === JSON.stringify(selection), `Unexpected selection for ${name}: ${JSON.stringify(current)}`);
  }
}

function assertAllRedacted(state: RoomState): void {
  assert(state.participants.length > 0, "Room had no participants");
  for (const current of state.participants) {
    assert(current.selection === null, `Anonymous response exposed a selection for ${current.name}`);
  }
}

const hostSelection: Selection = {
  activity: "food",
  budget: "1000",
  distance: "nearby",
  hardNos: ["spicy-food"],
};

const guestSelection: Selection = {
  activity: "movie",
  budget: "1500",
  distance: "5km",
  hardNos: ["crowds"],
};

const updatedGuestSelection: Selection = {
  activity: "games",
  budget: "500",
  distance: "anywhere",
  hardNos: [],
};

async function main(): Promise<void> {
  const room = await request<RoomCredentials & RoomState>("/rooms", jsonBody({ name: `Privacy Host ${marker}` }));
  const credentials: RoomCredentials = {
    slug: room.slug,
    hostToken: room.hostToken,
    participantToken: room.participantToken,
  };
  const hostName = `Privacy Host ${marker}`;
  const guestName = `Privacy Guest ${marker}`;

  assertAllRedacted(room);
  assert(participant(room, hostName).preferencesSubmitted === false, "New host should be waiting");

  const anonymousBeforeJoin = await request<RoomState>(`/rooms/${room.slug}/state`);
  assertAllRedacted(anonymousBeforeJoin);

  const guest = await request<RoomCredentials & RoomState>(`/rooms/${room.slug}/join`, {
    ...jsonBody({ name: guestName }),
  });
  credentials.participantToken = guest.participantToken;
  assertAllRedacted(guest);

  const guestUpdate = await request<RoomState>(`/rooms/${room.slug}/preferences`, {
    method: "PUT",
    headers: headers({ participantToken: credentials.participantToken }),
    body: JSON.stringify(guestSelection),
  });
  assert(participant(guestUpdate, guestName).selection !== null, "Preference update response should show the submitting participant's selection");
  assert(participant(guestUpdate, hostName).selection === null, "Waiting host should remain null after guest submits");

  const anonymousAfterGuestUpdate = await request<RoomState>(`/rooms/${room.slug}/state`);
  assertAllRedacted(anonymousAfterGuestUpdate);

  const hostViewAfterGuestUpdate = await request<RoomState>(`/rooms/${room.slug}/state`, {
    headers: headers({ hostToken: credentials.hostToken }),
  });
  assertAllSelections(hostViewAfterGuestUpdate, { [guestName]: guestSelection });
  assert(participant(hostViewAfterGuestUpdate, hostName).selection === null, "Waiting host should not have stale selection data");

  const guestChange = await request<RoomState>(`/rooms/${room.slug}/preferences`, {
    method: "PUT",
    headers: headers({ participantToken: credentials.participantToken }),
    body: JSON.stringify(updatedGuestSelection),
  });
  assertAllSelections(guestChange, { [hostName]: hostSelection, [guestName]: updatedGuestSelection });

  const anonymousAfterChange = await request<RoomState>(`/rooms/${room.slug}/state`);
  assertAllRedacted(anonymousAfterChange);

  const hostUpdate = await request<RoomState>(`/rooms/${room.slug}/preferences`, {
    method: "PUT",
    headers: headers({ participantToken: room.participantToken }),
    body: JSON.stringify(hostSelection),
  });
  assertAllSelections(hostUpdate, { [hostName]: hostSelection, [guestName]: updatedGuestSelection });

  const shortlistResponse = await request<RoomState>(`/rooms/${room.slug}/state`, {
    headers: headers({ participantToken: credentials.participantToken }),
  });
  assert(shortlistResponse.phase === "shortlist", "Room did not enter shortlist phase");
  assertAllSelections(shortlistResponse, { [hostName]: hostSelection, [guestName]: updatedGuestSelection });

  const anonymousShortlist = await request<RoomState>(`/rooms/${room.slug}/state`);
  assertAllRedacted(anonymousShortlist);

  const votingResponse = await request<RoomState>(`/rooms/${room.slug}/phase`, {
    method: "PUT",
    headers: headers({ participantToken: credentials.participantToken }),
    body: JSON.stringify({ phase: "voting" }),
  });
  assert(votingResponse.phase === "voting", "Room did not enter voting phase");
  assertAllSelections(votingResponse, { [hostName]: hostSelection, [guestName]: updatedGuestSelection });

  const anonymousVoting = await request<RoomState>(`/rooms/${room.slug}/state`);
  assertAllRedacted(anonymousVoting);

  console.log(`PASS room selection privacy lifecycle (${room.slug})`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
