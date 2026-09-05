---
name: Native share payloads
description: Cross-platform behavior of PlanJam invite links shared through navigator.share.
---

When an invite must paste as a valid URL, the native share payload should contain only the canonical URL. Some share targets concatenate the `text` and `url` fields into one clipboard value, turning an otherwise valid link into a URL followed by invitation copy.

**Why:** Share-sheet behavior varies by browser, operating system, and target application; separate text and URL fields are not reliably preserved.

**How to apply:** Keep the share button’s payload URL-only and use surrounding UI copy for the invitation message. Keep the explicit copy control URL-only as well.