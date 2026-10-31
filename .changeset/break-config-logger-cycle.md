---
'agentic-node-ts-starter': minor
---

Break the config ↔ logger cycle and remove import-time side effects

- `src/config.ts` no longer imports the logger or calls `process.exit`. The new `loadConfig(env?)` factory validates any environment object and throws a `ConfigError` (formatted report in `message`, `ZodError` in `cause`); the exported `config` singleton is `loadConfig()` evaluated on import.
- `LOG_LEVEL` now defaults to `silent` under `NODE_ENV=test` (unchanged: `info` in production, `debug` otherwise) and `LOG_OUTPUT` defaults to `stdout` in the schema, so the configuration is the single source of truth for logging.
- `src/logger.ts` reads the validated `Config` instead of re-parsing `process.env`. The new `createLogger(config)` factory returns an independent `LoggerInstance` (`logger`, `switchLogOutput`, `getLoggerOutputMode`, `createChildLogger`); the module-level exports are thin wrappers around a default instance and nothing is logged at import time.
- An unknown `LOG_OUTPUT` is now a configuration error at startup instead of a silent fallback to stdout. Fallback to stdout still applies when the configured destination cannot be opened (invalid log file path or syslog host).
- The "Configuration loaded successfully" startup line is emitted by the entry point (`src/index.ts`).
- Tests build fixtures with `loadConfig(env)` / `createLogger(config)` instead of mutating `process.env` and resetting modules.
