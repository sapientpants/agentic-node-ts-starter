# Observability Roadmap

## Current State

The project currently implements structured logging with Pino, which provides:

- Structured JSON logging in production
- Correlation ID support via environment variables
- Context propagation through child loggers
- Performance-optimized logging

## OpenTelemetry Integration (Future)

The logger module has been designed with OpenTelemetry integration in mind. The following placeholders and patterns are ready for future implementation:

### Trace Context Integration

The `withTraceContext` helper function is ready to integrate with OpenTelemetry:

```typescript
import { logger, withTraceContext } from './logger.js';
import { trace } from '@opentelemetry/api';

// Future implementation example
const span = trace.getActiveSpan();
const spanContext = span?.spanContext();

const tracedLogger = withTraceContext(logger, spanContext?.traceId, spanContext?.spanId);

tracedLogger.info('Operation with trace context');
```

### Correlation ID from OpenTelemetry

Currently, correlation IDs come from environment variables. In the future, they will be extracted from OpenTelemetry context:

```typescript
// Current (placeholder)
correlationId: process.env.CORRELATION_ID;

// Future (with OpenTelemetry)
correlationId: trace.getActiveSpan()?.spanContext().traceId;
```

### Planned OpenTelemetry Features

1. **Automatic Trace Context Propagation**
   - Extract trace and span IDs from active OpenTelemetry context
   - Automatically attach to all log entries
   - Correlate logs with distributed traces

2. **Metrics Integration**
   - Export custom metrics alongside logs
   - Track application performance indicators
   - Integrate with Prometheus/Grafana

3. **Distributed Tracing**
   - Instrument HTTP requests/responses
   - Track database queries
   - Monitor external service calls
   - Support for W3C Trace Context propagation

4. **Exporters Configuration**

   ```typescript
   // Future configuration example
   import { NodeSDK } from '@opentelemetry/sdk-node';
   import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
   import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

   const sdk = new NodeSDK({
     traceExporter: new OTLPTraceExporter({
       url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
     }),
     metricReader: new PeriodicExportingMetricReader({
       exporter: new OTLPMetricExporter({
         url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
       }),
     }),
   });
   ```

## Migration Path

When implementing OpenTelemetry:

1. **Install OpenTelemetry packages**

   ```bash
   pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
   ```

2. **Initialize OpenTelemetry SDK**
   - Create `src/telemetry.ts` for SDK initialization
   - Configure exporters (OTLP, Jaeger, Zipkin, etc.)
   - Set up auto-instrumentation

3. **Update Logger Integration**
   - Modify `getLoggerConfig()` to extract correlation IDs from OpenTelemetry context
   - Update `withTraceContext()` to use active span context
   - Add span events for important log entries

4. **Instrument Application Code**
   - Add custom spans for business operations
   - Track custom metrics
   - Implement baggage propagation for metadata

## Environment Variables

Future OpenTelemetry configuration will use standard environment variables:

```bash
# Service identification
OTEL_SERVICE_NAME=agentic-node-ts-starter
OTEL_SERVICE_VERSION=1.0.0

# Exporter configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Resource attributes
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.namespace=myapp

# Sampling
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

## Benefits of Future Integration

1. **Unified Observability**: Logs, traces, and metrics in one platform
2. **Root Cause Analysis**: Correlate logs with specific trace spans
3. **Performance Monitoring**: Track latency and throughput across services
4. **Error Tracking**: Automatically capture and trace errors
5. **Service Dependencies**: Visualize service communication patterns
6. **SLO/SLI Tracking**: Monitor service level objectives with metrics

## Compatible Backends

The OpenTelemetry integration will support various observability backends:

- **Cloud Providers**
  - AWS X-Ray
  - Google Cloud Trace
  - Azure Application Insights

- **Open Source**
  - Jaeger
  - Zipkin
  - Grafana Tempo
  - SigNoz

- **Commercial**
  - Datadog
  - New Relic
  - Honeycomb
  - Dynatrace
  - Splunk

## References

- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/otel/trace/semantic_conventions/)
