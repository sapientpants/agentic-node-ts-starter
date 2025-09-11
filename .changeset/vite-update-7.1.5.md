---
'agentic-node-ts-starter': patch
---

chore: update Vite to 7.1.5

- Explicitly add Vite 7.1.5 as a dev dependency
- Previously Vite 7.1.3 was only included as an indirect dependency through Vitest
- All tests pass with the updated version
