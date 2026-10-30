---
'agentic-node-ts-starter': patch
---

fix: show received values in configuration error messages

Zod 4 only populates `issue.input` when parsing with `reportInput: true`, so the
`(received: "...")` suffix never appeared and missing variables were misreported
as "Invalid format". Configuration is now parsed with `reportInput: true`, missing
variables are detected via `input === undefined`, and sensitive values
(PASSWORD/TOKEN/SECRET/KEY) are fully redacted as `***` instead of leaking their
first and last two characters.
