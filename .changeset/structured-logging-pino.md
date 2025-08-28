---
'agentic-node-ts-starter': minor
---

feat: add structured logging with Pino

Implements structured logging foundation with Pino logger:

- Environment-based configuration (development, production, test)
- Automatic sensitive data redaction for security
- Child logger creation for module-specific logging with proper method preservation
- Pretty-print formatting in development, JSON in production
- OpenTelemetry integration placeholders for future observability
- Comprehensive test coverage (100%) for all logger functionality
- Fixed withContext method preservation on child loggers (addresses PR feedback)

Closes #66
