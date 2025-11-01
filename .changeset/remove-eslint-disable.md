---
'agentic-node-ts-starter': patch
---

refactor: remove eslint-disable comments from source code

- Replaced console.error/warn with process.stderr.write for bootstrap logging
- Created type-safe valueToString() helper to avoid @typescript-eslint/no-base-to-string
- Added fallback logger using pino for initialization errors
- Fixed unsafe type assertions with proper Record<string, unknown> casting
- Updated tests to match new implementation
- Coverage improved from 76.66% to 81.66%
