---
name: Replit pnpm runtime pins
description: Replit workspace behavior around packageManager pins and managed pnpm execution.
---

When Replit-managed workflows already provide pnpm, adding a root `packageManager` pin can make every workflow attempt a self-install of that exact pnpm version. If that bootstrap fails, the application never reaches its own start command.

**Why:** A package-manager bootstrap failure looks like a frontend or API startup failure in the workflow panel, even though the application code is healthy.

**How to apply:** Prefer the pnpm version provisioned by Replit for this workspace unless a specific pin is required and verified. If all workflows fail during `pnpm add pnpm@...`, inspect the root `package.json` before changing app code.