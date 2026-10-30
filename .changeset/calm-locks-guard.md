---
'agentic-node-ts-starter': patch
---

fix: resolve all OSV scanner vulnerabilities in the dependency tree

- Bump direct dependencies: zod 4.6.7, vite 8.3.5, vitest / @vitest/ui / @vitest/coverage-v8 5.0.5
- Add pnpm overrides for brace-expansion, markdown-it, undici, body-parser, compression, smol-toml and katex
- Ignore the withdrawn braces stack-exhaustion advisory in osv-scanner.toml (no fixed release exists)
