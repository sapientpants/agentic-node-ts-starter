---
'agentic-node-ts-starter': minor
---

feat: Add mandatory Zod-based environment configuration loader

- Added comprehensive environment configuration system with Zod validation
- Configuration is now MANDATORY - application won't start without valid config
- Type-safe access to all environment variables with TypeScript inference
- Automatic sensitive value masking in error messages
- Comprehensive documentation and examples in docs/CONFIG.md
- Full test coverage with 25 tests
- Helper functions for checking and accessing configuration values

Closes #99
