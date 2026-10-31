---
'agentic-node-ts-starter': minor
---

Remove test-only exports and gate them with knip's production mode

- Removed `getConfigKeys` and `__testExports` from `src/config.ts`, and the `LoggerOptions` re-export from `src/logger.ts` (import it from `pino` directly). `src/logger.ts` no longer needs the barrel-file lint exemption.
- `getConfig`, `hasConfig`, `switchLogOutput` and `withTraceContext` are documented template API with no caller in the template itself; they are now marked `@public` so knip keeps them.
- `pnpm dead-code` runs `knip` and `knip --production`. Production mode treats only `src/index.ts` and `src/dev/` as entries, so an export that only tests import now fails the gate instead of passing because tests were entries.
- Removed `ts-prune`, which exited 0 while reporting hits and is covered by knip.
- Config tests exercise error formatting and secret masking through `ConfigError` and `loadConfig` instead of private internals.
