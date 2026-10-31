---
'agentic-node-ts-starter': patch
---

fix: idiomatic zod validators, honour `maxDepth` in `inspect()`, document template self-check tests

- `src/index.ts` now uses `z.uuid()` and `z.email()` instead of hand-rolled regexes, so the example shows the idiomatic Zod 4 form.
- `inspect()` in `src/dev/debug-utils.ts` renders objects with `util.inspect(obj, { depth: maxDepth })`; the depth argument is now honoured and circular references or BigInt values no longer throw.
- `docs/GETTING_STARTED.md` lists `tests/documentation.spec.ts` and `tests/container-scan.spec.ts` as template self-checks that consumers can delete.
