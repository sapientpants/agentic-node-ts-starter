---
'agentic-node-ts-starter': minor
---

feat: Enable TypeScript ESLint rules requiring type information

- Added TypeScript ESLint type-aware rules (@typescript-eslint/recommended-type-checked)
- Configured ESLint to use TypeScript compiler for enhanced type checking
- Type-aware rules now catch floating promises, unsafe type assertions, and other subtle type-safety issues
- Rules apply to src/**/\*.ts and tests/**/\*.ts files
- Minimal performance impact (~1.5s for full project lint)
- Improved code quality and runtime safety through compile-time checks

Closes #61
