---
name: API codegen Zod compatibility
description: Compatibility constraint for URI fields in the generated API validators.
---

Avoid OpenAPI `format: uri` on fields that also use a URL allowlist pattern in this workspace; express the allowlist with `pattern` alone.

**Why:** The current generator emits the Zod 4-style `zod.url()` helper for `format: uri`, while the generated validator package resolves Zod 3 and fails type checking.

**How to apply:** For server-validated outbound links, use a strict anchored OpenAPI regex pattern and rerun API codegen. Revisit this only after the validator package is consistently on Zod 4.