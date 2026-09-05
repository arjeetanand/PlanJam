import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateRoomBody, CreateRoomResponse, GetRoomStateParams, GetRoomStateResponse,
  JoinRoomBody, JoinRoomParams, JoinRoomResponse, UpdateRoomPhaseBody,
  UpdateRoomPhaseParams, UpdateRoomPhaseResponse, UpdateRoomPreferencesBody,
  UpdateRoomPreferencesParams, UpdateRoomPreferencesResponse, UpdateRoomVotesBody,
  UpdateRoomVotesParams, UpdateRoomVotesResponse,
} from "@workspace/api-zod";
import { RoomError, advancePhase, createRoom, joinRoom, requireRoom, roomState, savePreferences, saveVotes } from "../lib/rooms";

const router: IRouter = Router();
const hits = new Map<string, number[]>();

function limited(req: Request, res: Response, key: string): boolean {
  const now = Date.now();
  const attempts = (hits.get(key) ?? []).filter((time) => time > now - 60_000);
  if (attempts.length >= 30) {
    res.status(429).json({ error: "Rate limit exceeded; try again shortly" });
    return true;
  }
  attempts.push(now);
  hits.set(key, attempts);
  return false;
}

function sendError(res: Response, error: unknown): void {
  if (error instanceof RoomError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    res.status(409).json({ error: "That participant name is already in use in this room" });
    return;
  }
  throw error;
}

function header(req: Request, name: string): string | undefined {
  const value = req.get(name);
  return typeof value === "string" ? value : undefined;
}

router.post("/rooms", async (req, res): Promise<void> => {
  const body = CreateRoomBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (limited(req, res, `create:${req.ip}`)) return;
  try {
    const state = await createRoom(body.data.name, body.data.location);
    req.log.info("Room created");
    res.status(201).json(CreateRoomResponse.parse(state));
  } catch (error) { sendError(res, error); }
});

router.post("/rooms/:slug/join", async (req, res): Promise<void> => {
  const params = JoinRoomParams.safeParse(req.params);
  const body = JoinRoomBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (limited(req, res, `join:${req.ip}:${params.data.slug}`)) return;
  try {
    const state = await joinRoom(params.data.slug, body.data.name);
    req.log.info({ slug: params.data.slug }, "Participant joined room");
    res.json(JoinRoomResponse.parse(state));
  } catch (error) { sendError(res, error); }
});

router.get("/rooms/:slug/state", async (req, res): Promise<void> => {
  const params = GetRoomStateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  try {
    const room = await requireRoom(params.data.slug);
    res.json(GetRoomStateResponse.parse(await roomState(room, header(req, "X-Participant-Token"), header(req, "X-Host-Token"))));
  } catch (error) { sendError(res, error); }
});

router.put("/rooms/:slug/preferences", async (req, res): Promise<void> => {
  const params = UpdateRoomPreferencesParams.safeParse(req.params);
  const body = UpdateRoomPreferencesBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (limited(req, res, `mutate:${req.ip}:${params.data.slug}`)) return;
  try {
    const room = await requireRoom(params.data.slug);
    res.json(UpdateRoomPreferencesResponse.parse(await savePreferences(room, header(req, "X-Participant-Token"), body.data)));
  } catch (error) { sendError(res, error); }
});

router.put("/rooms/:slug/votes", async (req, res): Promise<void> => {
  const params = UpdateRoomVotesParams.safeParse(req.params);
  const body = UpdateRoomVotesBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (limited(req, res, `mutate:${req.ip}:${params.data.slug}`)) return;
  try {
    const room = await requireRoom(params.data.slug);
    res.json(UpdateRoomVotesResponse.parse(await saveVotes(room, header(req, "X-Participant-Token"), body.data.votes)));
  } catch (error) { sendError(res, error); }
});

router.put("/rooms/:slug/phase", async (req, res): Promise<void> => {
  const params = UpdateRoomPhaseParams.safeParse(req.params);
  const body = UpdateRoomPhaseBody.safeParse(req.body);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (limited(req, res, `mutate:${req.ip}:${params.data.slug}`)) return;
  try {
    const room = await requireRoom(params.data.slug);
    res.json(UpdateRoomPhaseResponse.parse(await advancePhase(room, header(req, "X-Host-Token"), header(req, "X-Participant-Token"), body.data.phase)));
  } catch (error) { sendError(res, error); }
});

export default router;