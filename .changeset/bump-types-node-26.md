---
'agentic-node-ts-starter': patch
---

chore(deps-dev): bump @types/node from 24.19.0 to 26.6.5

Enables `skipLibCheck` in tsconfig.json: @types/node 26 removed the deprecated
`worker_threads.TransferListItem` alias that pino's `thread-stream` typings still
reference (thread-stream issue 228), which broke `tsc` on declaration files
outside this project. Project sources and tests remain fully type-checked.
