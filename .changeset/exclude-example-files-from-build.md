---
'agentic-node-ts-starter': patch
---

Exclude `*.example.ts` placeholder files from the production build so they no longer ship in `dist/` or the Docker image (closes #188).
