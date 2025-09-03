---
'agentic-node-ts-starter': patch
---

feat: Add comprehensive security validation for logging configuration

- Add path traversal protection for file logging paths
- Validate syslog hostnames and ports to prevent injection attacks
- Block writing logs to restricted system directories
- Set explicit file permissions (640 by default) for log files
- Create directories with restrictive permissions (750)
- Add proper cleanup for file descriptors to prevent resource leaks
- Add configurable test timeouts for CI reliability
- Improve error handling with fallback to stdout on validation failures
- Add comprehensive security documentation
