import { spawn, type ChildProcess } from "node:child_process";

declare const document: any;
declare const navigator: any;
declare const window: any;

type JsonRecord = Record<string, unknown>;

type RoomCredentials = {
  slug: string;
  participantToken: string;
  hostToken: string;
};

type Plan = { id: string };

type RoomState = {
  slug: string;
  phase: "preferences" | "shortlist" | "voting" | "final";
  participants: Array<{ name: string; preferencesSubmitted: boolean }>;
  shortlist: Plan[];
  voteTotals: Array<{ planId: string }>;
  winner: string | null;
};

type CdpEventListener = (params: JsonRecord) => void;

const webOrigin = (process.env.PLANJAM_WEB_ORIGIN ?? "http://127.0.0.1:80").replace(/\/$/, "");
const apiOrigin = (process.env.PLANJAM_API_ORIGIN ?? "http://127.0.0.1:8080/api").replace(/\/$/, "");
const chromiumPath = process.env.CHROMIUM_PATH ?? "/repl/tools/bin/chromium";
const debugPort = Number(process.env.CHROMIUM_DEBUG_PORT ?? "9229");
const viewports = [320, 375, 768, 1024, 1440];
const marker = Date.now().toString(36);
let currentViewport = 1440;
let currentCheckLabel = `startup @ ${currentViewport}px`;
const browserIssues: string[] = [];
const expectedFailedRequestFragments = new Set<string>();
const requestUrls = new Map<string, string>();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function recordBrowserIssue(event: string, message: string): void {
  browserIssues.push(`${currentCheckLabel} — ${event}: ${message}`);
}

function isExpectedFailedRequest(url: string): boolean {
  return [...expectedFailedRequestFragments].some((fragment) => url.includes(fragment));
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function assertWorkflowReady(label: string, url: string, startupHint: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`SETUP ${label} workflow is unavailable at ${url}: ${detail}. ${startupHint}`);
  }
  if (!response.ok) {
    throw new Error(`SETUP ${label} workflow returned ${response.status} from ${url}. ${startupHint}`);
  }
}
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
    // Keep the text for an actionable failure below.
  }
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} returned ${response.status}: ${text}`);
  }
  return body as T;
}

function jsonBody(value: unknown, headers: Record<string, string> = {}): RequestInit {
  return { method: "POST", headers, body: JSON.stringify(value) };
}

function authHeaders(credentials: Partial<RoomCredentials>): Record<string, string> {
  return {
    ...(credentials.participantToken ? { "x-participant-token": credentials.participantToken } : {}),
    ...(credentials.hostToken ? { "x-host-token": credentials.hostToken } : {}),
  };
}

class CdpPage {
  private readonly socket: any;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private readonly listeners = new Map<string, Set<CdpEventListener>>();

  private constructor(socket: any) {
    this.socket = socket;
    socket.onmessage = (event: { data: string }) => {
      const message = JSON.parse(event.data) as { id?: number; method?: string; params?: JsonRecord; result?: any; error?: { message: string } };
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      if (message.method) {
        for (const listener of this.listeners.get(message.method) ?? []) listener(message.params ?? {});
      }
    };
  }

  static async connect(webSocketUrl: string): Promise<CdpPage> {
    const socket = new WebSocket(webSocketUrl);
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("Could not connect to Chromium DevTools"));
    });
    const page = new CdpPage(socket);
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Network.enable");
    return page;
  }

  on(method: string, listener: CdpEventListener): void {
    const listeners = this.listeners.get(method) ?? new Set<CdpEventListener>();
    listeners.add(listener);
    this.listeners.set(method, listeners);
  }

  async send<T = any>(method: string, params: JsonRecord = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send<{ result?: { value?: T }; exceptionDetails?: { text?: string } }>("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed");
    return result.result?.value as T;
  }

  async run<T>(callback: (...args: any[]) => unknown, ...args: unknown[]): Promise<T> {
    const serializedArgs = args.map((arg) => JSON.stringify(arg)).join(",");
    return this.evaluate<T>(`(${callback.toString()})(${serializedArgs})`);
  }

  async navigate(url: string): Promise<void> {
    const loaded = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out loading ${url}`)), 15000);
      this.on("Page.loadEventFired", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    await this.send("Page.navigate", { url });
    await loaded;
    await sleep(350);
  }

  async setViewport(width: number): Promise<void> {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async setReducedMotion(reduced: boolean): Promise<void> {
    await this.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }],
    });
  }

  async tab(): Promise<void> {
    await this.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await this.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await sleep(50);
  }

  async waitFor(selector: string, timeout = 8000): Promise<void> {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const found = await this.run<boolean>((value) => !!document.querySelector(value), selector);
      if (found) return;
      await sleep(100);
    }
    throw new Error(`Timed out waiting for ${selector}`);
  }

  async click(selector: string): Promise<void> {
    const clicked = await this.run<boolean>((value) => {
      const element = document.querySelector(value);
      if (!element) return false;
      element.click();
      return true;
    }, selector);
    assert(clicked, `Could not click ${selector}`);
    await sleep(250);
  }

  async close(): Promise<void> {
    this.socket.close();
  }
}

async function startBrowser(): Promise<{ page: CdpPage; process: ChildProcess }> {
  const browserProcess = spawn(chromiumPath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=/tmp/planjam-responsive-${process.pid}`,
    "about:blank",
  ], { stdio: "ignore" });

  const started = Date.now();
  while (Date.now() - started < 10000) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await response.json() as Array<{ type: string; webSocketDebuggerUrl?: string }>;
      const target = targets.find((candidate) => candidate.type === "page" && candidate.webSocketDebuggerUrl);
      if (target?.webSocketDebuggerUrl) {
        return { page: await CdpPage.connect(target.webSocketDebuggerUrl), process: browserProcess };
      }
    } catch {
      // Chromium is still starting.
    }
    await sleep(100);
  }
  browserProcess.kill();
  throw new Error(`Chromium did not open DevTools on port ${debugPort}`);
}

async function createRoom(name: string): Promise<RoomCredentials & RoomState> {
  return request<RoomCredentials & RoomState>("/rooms", jsonBody({ name }));
}

async function preparePreferencesRoom(): Promise<RoomCredentials> {
  const room = await createRoom(`Responsive Preferences ${marker}`);
  const guest = await request<RoomCredentials & RoomState>(`/rooms/${room.slug}/join`, jsonBody({ name: `Responsive Guest ${marker}` }));
  await request<RoomState>(`/rooms/${room.slug}/preferences`, {
    method: "PUT",
    headers: authHeaders({ participantToken: room.participantToken }),
    body: JSON.stringify({ activity: "food", budget: "1000", distance: "nearby", hardNos: [] }),
  });
  return { slug: room.slug, participantToken: room.participantToken, hostToken: room.hostToken };
}

async function prepareRoomAtPhase(targetPhase: "shortlist" | "voting" | "final", name: string): Promise<RoomCredentials & RoomState> {
  const room = await createRoom(`Responsive ${name} ${marker}`);
  const guest = await request<RoomCredentials & RoomState>(`/rooms/${room.slug}/join`, jsonBody({ name: `${name} Guest ${marker}` }));
  const selection = { activity: "food", budget: "1000", distance: "nearby", hardNos: [] };
  for (const participantToken of [room.participantToken, guest.participantToken]) {
    await request<RoomState>(`/rooms/${room.slug}/preferences`, {
      method: "PUT",
      headers: authHeaders({ participantToken }),
      body: JSON.stringify(selection),
    });
  }
  let state = await request<RoomState>(`/rooms/${room.slug}/phase`, {
    method: "PUT",
    headers: authHeaders({ hostToken: room.hostToken }),
    body: JSON.stringify({ phase: "shortlist" }),
  });
  if (targetPhase === "shortlist") return { ...room, ...state };

  state = await request<RoomState>(`/rooms/${room.slug}/phase`, {
    method: "PUT",
    headers: authHeaders({ hostToken: room.hostToken }),
    body: JSON.stringify({ phase: "voting" }),
  });
  if (targetPhase === "voting") return { ...room, ...state };

  const votes = Object.fromEntries(state.shortlist.map((plan, index) => [plan.id, index === 0 ? "love" : "works"]));
  for (const participantToken of [room.participantToken, guest.participantToken]) {
    await request<RoomState>(`/rooms/${room.slug}/votes`, {
      method: "PUT",
      headers: authHeaders({ participantToken }),
      body: JSON.stringify({ votes }),
    });
  }
  state = await request<RoomState>(`/rooms/${room.slug}/phase`, {
    method: "PUT",
    headers: authHeaders({ hostToken: room.hostToken }),
    body: JSON.stringify({ phase: "final" }),
  });
  return { ...room, ...state };
}

async function setRoomTokens(page: CdpPage, credentials: RoomCredentials): Promise<void> {
  await page.navigate(`${webOrigin}/`);
  await page.run((tokens) => {
    localStorage.setItem(`planjam_participant_${tokens.slug}`, tokens.participantToken);
    localStorage.setItem(`planjam_host_${tokens.slug}`, tokens.hostToken);
  }, credentials);
}

async function assertNoHorizontalOverflow(page: CdpPage, label: string): Promise<void> {
  const metrics = await page.run<{ width: number; scrollWidth: number; bodyScrollWidth: number }>(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(metrics.scrollWidth <= metrics.width + 1, `${label} overflows horizontally: ${metrics.scrollWidth}px > ${metrics.width}px`);
  assert(metrics.bodyScrollWidth <= metrics.width + 1, `${label} body overflows horizontally: ${metrics.bodyScrollWidth}px > ${metrics.width}px`);
}

async function assertVisible(page: CdpPage, selector: string, label: string): Promise<void> {
  const state = await page.run<{ found: boolean; visible: boolean }>((value) => {
    const element = document.querySelector(value);
    if (!element) return { found: false, visible: false };
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    return { found: true, visible: rect.width > 0 && rect.height > 0 && styles.display !== "none" && styles.visibility !== "hidden" };
  }, selector);
  assert(state.found && state.visible, `${label} did not render ${selector}`);
}

async function assertKeyboardFocus(page: CdpPage, label: string, selectors: string[]): Promise<void> {
  await page.run(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });

  const reached = new Set<string>();
  let previousFocus = "";
  let repeatedFocusCount = 0;
  const trail: string[] = [];
  let tabsAfterAllRequiredControls = 0;

  for (let attempt = 0; attempt < 80 && tabsAfterAllRequiredControls < 3; attempt += 1) {
    await page.tab();
    const focus = await page.run<{ identifier: string; matches: string[]; visiblyOutlined: boolean }>((expectedSelectors: string[]) => {
      const element = document.activeElement;
      if (!element || element === document.body) {
        return { identifier: "", matches: [], visiblyOutlined: false };
      }
      const styles = window.getComputedStyle(element);
      const outlineWidth = Number.parseFloat(styles.outlineWidth);
      return {
        identifier: element.getAttribute("data-testid") || `${element.tagName.toLowerCase()}:${element.textContent?.trim().slice(0, 30) ?? ""}`,
        matches: expectedSelectors.filter((selector) => element.matches(selector)),
        visiblyOutlined: styles.outlineStyle !== "none" && outlineWidth > 0 && styles.outlineColor !== "rgba(0, 0, 0, 0)",
      };
    }, selectors);

    if (!focus.identifier) {
      assert(reached.size === selectors.length, `${label} lost focus before reaching every required control (focus may be trapped)`);
      break;
    }
    trail.push(focus.identifier);
    if (focus.identifier === previousFocus) {
      repeatedFocusCount += 1;
    } else {
      repeatedFocusCount = 0;
    }
    assert(repeatedFocusCount < 2, `${label} repeated ${focus.identifier} instead of advancing focus: ${trail.join(" → ")}`);

    for (const selector of focus.matches) {
      reached.add(selector);
      assert(focus.visiblyOutlined, `${label} focus on ${selector} is not visibly outlined`);
    }
    previousFocus = focus.identifier;
    if (reached.size === selectors.length) tabsAfterAllRequiredControls += 1;
  }

  assert(reached.size === selectors.length, `${label} did not reach every required control. Reached ${[...reached].join(", ") || "none"}; trail: ${trail.join(" → ")}`);
  console.log(`PASS ${label} keyboard focus`);
}

async function assertReducedMotion(page: CdpPage, label: string, selectors: string[]): Promise<void> {
  const states = await page.run<Array<{ selector: string; found: boolean; visible: boolean; animationName: string; transitionDuration: string }>>((expectedSelectors: string[]) => expectedSelectors.map((selector) => {
    const element = document.querySelector(selector);
    if (!element) return { selector, found: false, visible: false, animationName: "", transitionDuration: "" };
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    return {
      selector,
      found: true,
      visible: rect.width > 0 && rect.height > 0 && styles.display !== "none" && styles.visibility !== "hidden",
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }), selectors);

  for (const state of states) {
    assert(state.found && state.visible, `${label} hid or failed to render ${state.selector}`);
    assert(state.animationName === "none", `${label} left ${state.selector} animated (${state.animationName})`);
    assert(state.transitionDuration === "0s", `${label} left ${state.selector} transitioning (${state.transitionDuration})`);
  }
  console.log(`PASS ${label} motion disabled without hiding content`);
}

async function assertAcrossViewports(
  page: CdpPage,
  label: string,
  check: (width: number) => Promise<void>,
  widths = viewports,
): Promise<void> {
  for (const width of widths) {
    currentViewport = width;
    currentCheckLabel = `${label} @ ${width}px`;
    await page.setViewport(width);
    try {
      await check(width);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`${label} at ${width}px failed: ${detail}`);
    }
    console.log(`PASS ${label} at ${width}px`);
  }
}

async function main(): Promise<void> {
  await assertWorkflowsReady();
  const { page, process: browserProcess } = await startBrowser();
  page.on("Runtime.consoleAPICalled", (params) => {
    if (String(params.type ?? "") !== "error") return;
    const args = Array.isArray(params.args) ? params.args : [];
    const message = args.map((argument) => {
      const value = argument as JsonRecord;
      return String(value.description ?? value.value ?? "");
    }).join(" ");
    recordBrowserIssue("console.error", message || "Browser console error");
  });
  page.on("Runtime.exceptionThrown", (params) => {
    const details = (params.exceptionDetails ?? {}) as JsonRecord;
    const exception = (details.exception ?? {}) as JsonRecord;
    recordBrowserIssue("uncaught exception", String(exception.description ?? details.text ?? "Unknown JavaScript exception"));
  });
  page.on("Network.requestWillBeSent", (params) => {
    const requestId = String(params.requestId ?? "");
    const request = (params.request ?? {}) as JsonRecord;
    const url = String(request.url ?? "");
    if (requestId && url) requestUrls.set(requestId, url);
  });
  page.on("Network.loadingFailed", (params) => {
    const url = requestUrls.get(String(params.requestId ?? "")) ?? "unknown URL";
    const errorText = String(params.errorText ?? "Unknown request failure");
    const canceled = params.canceled === true || errorText === "net::ERR_ABORTED";
    if (canceled || isExpectedFailedRequest(url)) return;
    recordBrowserIssue("failed request", `${errorText} (${url})`);
  });
  page.on("Network.responseReceived", (params) => {
    const response = (params.response ?? {}) as JsonRecord;
    const status = Number(response.status ?? 0);
    const url = String(response.url ?? "");
    if (status < 400 || isExpectedFailedRequest(url)) return;
    recordBrowserIssue("HTTP error response", `${status} ${url}`);
  });
  const entryRoom = await createRoom(`Responsive Join ${marker}`);
  expectedFailedRequestFragments.add(`/api/rooms/${entryRoom.slug}/state`);
  const preferencesRoom = await preparePreferencesRoom();
  const shortlistRoom = await prepareRoomAtPhase("shortlist", "Shortlist");
  const votingRoom = await prepareRoomAtPhase("voting", "Voting");
  const finalRoom = await prepareRoomAtPhase("final", "Final");

  try {
    await assertAcrossViewports(page, "landing page", async (width) => {
      await page.navigate(`${webOrigin}/`);
      await assertNoHorizontalOverflow(page, `landing page at ${width}px`);
      await assertVisible(page, '[data-testid="input-host-name"]', "landing page");
      await assertVisible(page, '[data-testid="button-start-planning"]', "landing page");
    });
    await page.navigate(`${webOrigin}/`);
    await assertKeyboardFocus(page, "landing page", ['[data-testid="button-start-planning"]']);

    await assertAcrossViewports(page, "join room", async (width) => {
      await page.navigate(`${webOrigin}/room/${entryRoom.slug}`);
      await page.waitFor('[data-testid="input-join-name"]');
      await assertNoHorizontalOverflow(page, `join room at ${width}px`);
      await assertVisible(page, '[data-testid="button-join-room"]', "join room");
      await assertVisible(page, '[data-testid="room-join-capacity"]', "join room");
    });

    currentCheckLabel = `room loading state @ ${currentViewport}px`;
    await page.send("Fetch.enable", { patterns: [{ urlPattern: "*api/rooms/*/state*", requestStage: "Request" }] });
    await page.navigate(`${webOrigin}/room/${entryRoom.slug}`);
    await page.waitFor('[data-testid="status-room-loading"]', 3000);
    console.log("PASS room loading state");
    await page.send("Fetch.disable");

    const invalidRoomSlug = `does-not-exist-${marker}`;
    expectedFailedRequestFragments.add(`/api/rooms/${invalidRoomSlug}/state`);
    currentCheckLabel = `room error state @ ${currentViewport}px`;
    await page.navigate(`${webOrigin}/room/${invalidRoomSlug}`);
    await page.waitFor('[data-testid="status-room-error"]');
    await assertVisible(page, '[data-testid="button-retry-room"]', "room error state");
    console.log("PASS room error state");

    await setRoomTokens(page, preferencesRoom);
    await assertAcrossViewports(page, "preferences phase", async (width) => {
      await page.navigate(`${webOrigin}/room/${preferencesRoom.slug}`);
      await page.waitFor('[data-testid="option-activity-food"]');
      await assertNoHorizontalOverflow(page, `preferences phase at ${width}px`);
      await assertVisible(page, '[data-testid="button-save-preferences"]', "preferences phase");
      await assertVisible(page, '[data-testid="room-capacity-message"]', "preferences phase invite card");
      await assertVisible(page, '[data-testid="roster-readiness-summary"]', "preferences phase readiness");
      await assertVisible(page, '[data-testid="status-next-steps"]', "preferences phase next steps");
    });

    await page.navigate(`${webOrigin}/room/${preferencesRoom.slug}`);
    await page.waitFor('[data-testid="option-activity-food"]');
    await assertKeyboardFocus(page, "preferences phase", [
      '[data-testid="button-save-preferences"]',
      '[data-testid="button-copy-link"]',
    ]);

    currentCheckLabel = `copy-link feedback @ ${currentViewport}px`;
    await page.click('[data-testid="button-copy-link"]');
    await page.waitFor('[data-testid="status-copy-link"]');
    const copyStatus = await page.run<string>(() => document.querySelector('[data-testid="status-copy-link"]')?.textContent ?? "");
    assert(copyStatus.includes("Link copied") || copyStatus.includes("Link selected") || copyStatus.includes("Copy failed"), `copy-link feedback was not rendered: ${copyStatus}`);
    console.log("PASS copy-link feedback state");

    await setRoomTokens(page, shortlistRoom);
    await assertAcrossViewports(page, "shortlist phase", async (width) => {
      await page.navigate(`${webOrigin}/room/${shortlistRoom.slug}`);
      await page.waitFor('[data-testid^="card-plan-"]');
      await assertNoHorizontalOverflow(page, `shortlist phase at ${width}px`);
      await assertVisible(page, '[data-testid^="card-plan-"]', "shortlist phase");
      await assertVisible(page, '[data-testid="roster-readiness-summary"]', "shortlist phase readiness");
      await assertVisible(page, '[data-testid="button-open-voting"]', "shortlist phase");
    });
    await page.navigate(`${webOrigin}/room/${shortlistRoom.slug}`);
    await page.waitFor('[data-testid^="card-plan-"]');
    await assertKeyboardFocus(page, "shortlist phase", [
      '[data-testid="button-open-voting"]',
    ]);

    await setRoomTokens(page, votingRoom);
    await assertAcrossViewports(page, "voting phase", async (width) => {
      await page.navigate(`${webOrigin}/room/${votingRoom.slug}`);
      await page.waitFor('[data-testid^="vote-plan-"]');
      await assertNoHorizontalOverflow(page, `voting phase at ${width}px`);
      await assertVisible(page, '[data-testid^="vote-love-"]', "voting phase");
      await assertVisible(page, '[data-testid="button-show-results"]', "voting phase");
      await page.click('[data-testid^="vote-love-"]');
      const pressed = await page.run<boolean>(() => document.querySelector('[data-testid^="vote-love-"]')?.getAttribute("aria-pressed") === "true");
      assert(pressed, "vote feedback did not mark the selected vote as pressed");
    });
    await page.navigate(`${webOrigin}/room/${votingRoom.slug}`);
    await page.waitFor('[data-testid^="vote-plan-"]');
    await assertKeyboardFocus(page, "voting phase", [
      '[data-testid^="vote-love-"]',
    ]);

    await setRoomTokens(page, finalRoom);
    await assertAcrossViewports(page, "final phase", async (width) => {
      await page.navigate(`${webOrigin}/room/${finalRoom.slug}`);
      await page.waitFor('[data-testid="text-winning-plan"]');
      await assertNoHorizontalOverflow(page, `final phase at ${width}px`);
      await assertVisible(page, '[data-testid="text-winning-plan"]', "final phase");
      await assertVisible(page, '[data-testid^="score-plan-"]', "final phase score breakdown");
      await assertVisible(page, '[data-testid="final-starting-point"]', "final phase recap");
      await assertVisible(page, '[data-testid="room-capacity-message"]', "final phase invite card");
    });
    await page.navigate(`${webOrigin}/room/${finalRoom.slug}`);
    await page.waitFor('[data-testid="text-winning-plan"]');
    await assertKeyboardFocus(page, "final phase recap", [
      '[data-testid^="button-roster-member-"]',
      '[data-testid="button-copy-link"]',
    ]);

    await page.setReducedMotion(true);
    await page.navigate(`${webOrigin}/`);
    await assertReducedMotion(page, "landing page reduced motion", [".page-in", ".floaty"]);
    await setRoomTokens(page, finalRoom);
    await page.navigate(`${webOrigin}/room/${finalRoom.slug}`);
    await page.waitFor('[data-testid="text-winning-plan"]');
    await assertVisible(page, '[data-testid="text-winning-plan"]', "reduced-motion final phase");
    await assertReducedMotion(page, "final celebration reduced motion", [".page-in", ".rise-in", ".confetti-piece"]);

    if (browserIssues.length > 0) {
      throw new Error(`Browser issues detected:\n${browserIssues.map((issue) => `- ${issue}`).join("\n")}`);
    }
    console.log("PASS responsive PlanJam browser regression suite with no browser issues");
  } finally {
    await page.close();
    browserProcess.kill();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function assertWorkflowsReady(): Promise<void> {
  console.log(`SETUP PlanJam workflow: ${webOrigin}`);
  console.log(`SETUP API workflow: ${apiOrigin}/healthz`);
  await Promise.all([
    assertWorkflowReady(
      "PlanJam",
      `${webOrigin}/`,
      "Start the existing artifacts/planjam: web workflow before running this check.",
    ),
    assertWorkflowReady(
      "API",
      `${apiOrigin}/healthz`,
      "Start the existing artifacts/api-server: API Server workflow before running this check.",
    ),
  ]);
}
