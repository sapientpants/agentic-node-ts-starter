# Observability Guide

This template includes **Pino** for structured logging, with patterns ready for your observability needs.

## What's Included

### Structured Logging with Pino

- **Development**: Pretty-printed, colorized logs
- **Production**: JSON format for log aggregation
- **Test**: Silent by default
- **Security**: Automatic redaction of sensitive fields

### Using the Logger

```typescript
import { logger, createChildLogger } from './logger.js';

// Basic logging with the default logger
logger.info('Application started');
logger.error({ err: error }, 'Operation failed');

// Child loggers for module-specific context
const myModuleLogger = createChildLogger('my-module');
myModuleLogger.info('Module initialized');

const dbLogger = createChildLogger('database');
dbLogger.debug({ query: 'SELECT *', duration: 45 }, 'Query executed');
```

See [docs/PATTERNS.md](./PATTERNS.md#structured-logging) for more examples.

## Extending for Your Project

### Adding OpenTelemetry

The logger is designed to work with OpenTelemetry when you're ready:

```bash
# When you need distributed tracing
pnpm add @opentelemetry/api @opentelemetry/sdk-node
```

The `withTraceContext` helper is already prepared for trace integration.

### Adding Metrics

For application metrics, consider:

- **Prometheus** - Time-series metrics
- **StatsD** - Simple metric aggregation
- **OpenTelemetry Metrics** - Unified with tracing

### Log Aggregation

In production, send logs to:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Datadog** / **New Relic** / **Splunk**
- **AWS CloudWatch** / **Google Cloud Logging**
- **Grafana Loki** for open-source stack

### Environment Variables

```bash
# Current logging configuration
NODE_ENV=production       # Controls log format
LOG_LEVEL=info            # Minimum log level
CORRELATION_ID=abc-123    # Request correlation

# Future OpenTelemetry (when you add it)
OTEL_SERVICE_NAME=my-app
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Tips for Production

1. **Use correlation IDs** for request tracking
2. **Add context** with child loggers per module
3. **Avoid logging sensitive data** (Pino redacts common fields)
4. **Set appropriate log levels** per environment
5. **Use structured logging** for better querying

## Learn More

- [Pino Documentation](https://getpino.io/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/instrumentation/js/) (when you're ready)
- [Logging Best Practices](https://www.datadoghq.com/blog/node-logging-best-practices/)
