---
'agentic-node-ts-starter': patch
---

Migrate the `@timed` and `@trace` debug decorators to the standard (TC39) decorator
signature so they type-check without `experimentalDecorators`, and add tests that apply
them with real decorator syntax. Vitest now transpiles files containing decorators with
the TypeScript compiler, since Vite's oxc transformer does not lower standard decorators.
