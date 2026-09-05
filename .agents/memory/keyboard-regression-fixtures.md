---
name: Keyboard regression fixtures
description: Browser keyboard checks must target controls that are rendered and enabled in each prepared phase.
---

Keyboard traversal fixtures should assert the controls a phase actually renders and enables, not controls from another phase or intentionally disabled actions.

**Why:** A missing or disabled target can make a valid Tab sequence look like a focus trap and obscure the accessibility regression being tested.

**How to apply:** When adding phase coverage, inspect the rendered state first and keep cross-phase controls covered by the phase where they are available.