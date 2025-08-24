# agentic-node-ts-starter

## 0.1.1

### Patch Changes

- [#10](https://github.com/sapientpants/agentic-node-ts-starter/pull/10) [`4ad85dd`](https://github.com/sapientpants/agentic-node-ts-starter/commit/4ad85dd59ccaa72152dfb770510ad8bfdb51830e) Thanks [@sapientpants](https://github.com/sapientpants)! - fix: document GitHub Actions permissions requirement for release workflow
  - Add clear documentation about required repository settings
  - Add comments in release workflow about permissions requirement
  - Add issues write permission for better GitHub integration
  - Update README, CONTRIBUTING, and CLAUDE documentation

  This fixes the release workflow failure by documenting that repository
  administrators must enable "Allow GitHub Actions to create and approve
  pull requests" in Settings → Actions → General.

- [#9](https://github.com/sapientpants/agentic-node-ts-starter/pull/9) [`62dbf2c`](https://github.com/sapientpants/agentic-node-ts-starter/commit/62dbf2cdf7e3ea4c6cea45f909840f976f3aed8b) Thanks [@sapientpants](https://github.com/sapientpants)! - feat: separate test and test:coverage scripts for better performance
  - Add dedicated `test:coverage` script for running tests with coverage
  - Update `test` script to run without coverage for faster local development
  - Update CI workflow to use `test:coverage` to maintain coverage reporting
  - Update documentation to reflect the new testing commands

  This improves the developer experience by making the default test command faster while still maintaining coverage reporting in CI.
