# Agentic Node + TypeScript Starter (Solo) — **mise + pnpm**

This repository is a **batteries-included** starting point for building software with an **agentic coding** workflow on Node.js + TypeScript. It bakes in a **spec-first, test-as-contract** approach, **quality gates**, **supply-chain security** (SBOM, SLSA provenance), and **progressive delivery** basics.

> Created: 2025-08-23

## Tooling
- **Runtime:** Node 22 via **mise** (`mise.toml`)
- **Package manager:** **pnpm 10** (pinned via mise)
- **TypeScript (strict)**, **Vitest**, **fast-check**, **Zod**
- **ESLint (flat) + Prettier**
- **Husky + lint-staged**
- **GitHub Actions CI**: typecheck, lint, tests, coverage, OSV scan, SBOM export, CodeQL, SLSA provenance

## Quick start
```bash
# Install Node 22 + pnpm 10 per mise.toml
mise install

# Bootstrap deps
pnpm install

# All checks
pnpm verify

# Run unit tests
pnpm test

# Generate SBOMs
pnpm sbom

# Create a changeset (versioning)
pnpm changeset
```

See `docs/PROCESS.md` for the end-to-end workflow and checklists.
