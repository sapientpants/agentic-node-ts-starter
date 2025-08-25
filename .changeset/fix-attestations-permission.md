---
'agentic-node-ts-starter': patch
---

fix: add attestations write permission to release workflow

The release workflow was failing with "Resource not accessible by integration" when trying to create attestations. Added the missing `attestations: write` permission.
