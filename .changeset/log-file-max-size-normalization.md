---
'agentic-node-ts-starter': patch
---

fix: normalize LOG_FILE_MAX_SIZE before passing it to pino-roll

`LOG_FILE_MAX_SIZE` accepted formats such as `10MB`, `100 KB` or `1.5G`, but the raw
string was forwarded to pino-roll, which only understands single-letter units and threw
`"<size> is not a valid size in KB, MB or GB"` inside the transport worker, crashing file
logging at startup. The parsed byte count is now passed as `<bytes>b`, an invalid value
disables rotation with a warning on stderr, and the accepted format is documented in
`docs/LOGGING_OUTPUT.md` and `.env.example`.
