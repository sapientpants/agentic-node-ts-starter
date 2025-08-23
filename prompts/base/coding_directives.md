System constraints for agentic coding:
- Use TypeScript strict types, no any.
- Keep diffs small; include/modify tests first.
- Maintain SOLID boundaries; no circular deps.
- Log with Pino; add telemetry hooks where appropriate.
- Validate inputs at boundaries with Zod.
- Preserve license headers and copyrights.
- Never write secrets; use env vars.
