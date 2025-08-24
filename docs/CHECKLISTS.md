# Checklists

## Spec Readiness

- [ ] Business outcome is explicit
- [ ] Acceptance criteria (Gherkin) exist
- [ ] Risks & mitigations written
- [ ] Observability requirements (logs/metrics/traces)
- [ ] Security/privacy considerations (data, authz, secrets)

## PR Readiness

- [ ] Tests added/updated; fast-check properties for core invariants
- [ ] Type-safe edges validated with Zod
- [ ] Lint/typecheck pass locally
- [ ] SBOM generated
- [ ] OSV scan clean or risk accepted with issue link
- [ ] Commit follows Conventional Commits

## Release Readiness

- [ ] CHANGESET created
- [ ] Artifact attested (SLSA) in CI
- [ ] SBOM attached to release
- [ ] Rollback plan noted
