---
'agentic-node-ts-starter': patch
---

docs: fix incorrect logger function references in documentation

- Fixed docs/OBSERVABILITY.md to use correct logger imports (logger instead of createLogger)
- Fixed docs/PATTERNS.md to use correct logger imports (logger instead of createLogger)
- Documentation now accurately reflects the actual exports from src/logger.ts

Closes #95
