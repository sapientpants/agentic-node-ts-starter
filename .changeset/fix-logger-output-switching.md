---
'agentic-node-ts-starter': patch
---

Fix `switchLogOutput` so that it reaches child loggers, closes the previous transport, and reports the effective output mode.

The root logger now writes through a single delegating stream, so the exported `logger` and every child created from it (including the `config` module logger created at import time) follow a runtime switch. The previous file, syslog, or pretty-print transport worker is closed once the new destination is active. `switchLogOutput` throws on an unknown mode or invalid configuration and keeps the current destination; at startup an invalid `LOG_OUTPUT` still falls back to stdout, and `getLoggerOutputMode()` now returns the destination actually in use. Dead `currentLoggerInstance` / `currentFileStream` state is removed.
