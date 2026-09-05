---
name: GitHub connector write gateway
description: Environment behavior observed when publishing repository contents through the installed GitHub integration.
---

GitHub repository reads can succeed while connector-backed POST/PUT writes are rejected by an upstream Cloudflare 403 before GitHub receives the request. The Octokit client exposed by the same connection can fail identically, and the workspace may have no usable CLI credential helper.

**Why:** Treating a successful repository read or an installed connection as proof of write availability can lead to partial or falsely reported publishes.

**How to apply:** Before a large publish, test the intended write route non-destructively or use a resumable strategy. If all authorized connector writes are blocked, preserve the remote branch and report the gateway block rather than handling credentials in chat or force-pushing.