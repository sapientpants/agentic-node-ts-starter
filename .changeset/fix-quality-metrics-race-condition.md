---
'agentic-node-ts-starter': patch
---

fix(ci): handle race condition in quality metrics update

Fixed a race condition where the quality metrics update job fails when the release process pushes a version bump commit to main before the metrics update completes. Added `git pull --rebase origin main` before pushing to handle concurrent updates.
