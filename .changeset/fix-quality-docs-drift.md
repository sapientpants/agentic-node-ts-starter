---
'agentic-node-ts-starter': patch
---

fix: read quality thresholds from their config files and correct documented coverage numbers

- `scripts/extract-quality-metrics.js` now reads coverage, duplication, mutation, and complexity thresholds from `vitest.config.ts`, `.jscpd.json`, `stryker.config.json`, and `eslint.config.js` instead of hard-coding them, so `quality-metrics.json` cannot drift again.
- Documentation, workflow comments, and agent command prompts now state the enforced branch coverage threshold (84%) rather than 80%.
