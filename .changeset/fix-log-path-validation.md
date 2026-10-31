---
'agentic-node-ts-starter': patch
---

Fix: `validateLogPath` no longer rejects legitimate paths (file names containing `..` such as `app..log`, relative paths such as `etc/app.log`, and directories that merely share a prefix with a system directory such as `/etcetera`). Restricted directories are now matched on the resolved absolute path as whole directories, Windows system directories are checked on win32, and all validation warnings go through the fallback logger instead of raw `process.stderr.write`.
