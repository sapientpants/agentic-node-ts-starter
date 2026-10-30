---
'agentic-node-ts-starter': minor
---

feat: move the runtime to Node.js 26

Node 26 became Active LTS on 2026-10-28 and Node 24 entered maintenance. The
mise pin, `engines.node`, the Docker base images, every GitHub workflow pin and
the docs now target Node 26, so `engines.node` is `>=26.0.0` (drops Node 24).

Fixes the Docker image, which had been broken since the pnpm 11 migration and
was further affected by Node 26 dropping Corepack:

- install the pinned pnpm with `npm install -g` instead of Corepack
- copy `pnpm-workspace.yaml` so the frozen install sees the overrides
- skip lifecycle scripts in the production stage (`prepare` runs husky, a dev
  dependency)
- set `NODE_ENV=production` so the logger does not require `pino-pretty`
- narrow `tsconfig.build.json` to `src` so the build emits `dist/index.js`,
  matching `pnpm start`, `.size-limit.json` and the image's `CMD`
