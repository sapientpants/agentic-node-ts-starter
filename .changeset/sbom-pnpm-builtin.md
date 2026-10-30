---
'agentic-node-ts-starter': patch
---

Generate the release SBOM with pnpm's built-in `sbom` command instead of cdxgen. pnpm 11 ships a built-in `sbom` subcommand that shadowed the package script and failed the release job with `ERR_PNPM_SBOM_NO_FORMAT`.
