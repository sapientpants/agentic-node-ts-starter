---
'agentic-node-ts-starter': patch
---

fix: apply `LOG_FILE_PERMISSIONS` to log files and directories

The validated mode was previously discarded. It is now passed to the `pino/file` and `pino-roll` transports as the file mode, and the log directory is created with a matching mode (for example `640` → `750`, `600` → `700`). Existing directories keep their permissions.
