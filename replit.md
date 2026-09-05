# PlanJam

PlanJam helps a group of four friends turn competing preferences into one shared plan through quick picks, group matching, and voting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/planjam/src/App.tsx` — the complete local-state planning flow and routes
- `artifacts/planjam/src/index.css` — PlanJam visual theme, responsive layout, and motion
- `artifacts/api-server/` — shared API scaffold retained for future server-backed features

## Architecture decisions

- The first build is frontend-only and uses local React state because the hackathon flow does not need accounts, persistence, or shared sessions.
- Wouter routes the five lightweight states so each step can be previewed and revisited without adding a backend.
- Friend preferences and recommendations are intentionally simulated to keep the core demo fast and self-contained.

## Product

- Home introduces the one-plan promise and starts a planning session.
- Preferences captures activity, budget, distance, and hard NOs.
- Group results simulates the other three friends and ranks three recommendation cards with match reasons.
- Vote captures Love it, Works, or No for each plan and settles on the group winner.
- Final celebrates the winning plan with a 4/4 confirmation and reset action.

## User preferences

- Keep the experience very small, polished, and usable within a 90-minute hackathon demo.

## Gotchas

- The PlanJam web workflow supplies `PORT` and `BASE_PATH`; run it through the managed artifact workflow rather than a root-level dev command.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
