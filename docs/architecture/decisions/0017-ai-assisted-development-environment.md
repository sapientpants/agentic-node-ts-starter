# 17. AI-Assisted Development Environment

Date: 2025-08-15

## Status

Accepted

## Context

The project previously standardized on Claude Code (claude.ai/code) as the primary AI-assisted development environment (ADR-0012). This decision tied the project to a specific commercial cloud service with the following concerns:

- **Vendor lock-in**: All workflows, commands, and configurations were specific to Claude Code's ecosystem
- **Cloud dependency**: Required internet connectivity and an Anthropic account for all development
- **Cost**: Ongoing per-user subscription costs for cloud-based AI access
- **Data privacy**: Source code and project context sent to external servers
- **Availability**: Service outages or pricing changes directly impact development

The project now uses **opencode** (an open-source, local-first AI development tool) with **local models** as the primary AI-assisted development environment. This shift addresses the above concerns while preserving the same development velocity and quality standards.

Key considerations:

- Local-first architecture with no cloud dependency
- Open-source tooling with full transparency
- Zero ongoing subscription costs
- Complete data privacy — source code never leaves the machine
- Offline capability for development
- Compatibility with existing project workflows (slash commands, git hooks, quality gates)

Options considered:

- **Claude Code**: Cloud-based, vendor-locked, requires subscription (previous choice)
- **GitHub Copilot**: Cloud-based, Microsoft ecosystem, requires subscription
- **Cursor**: Cloud-based editor with AI features, vendor-locked
- **opencode + local models**: Open-source, local-first, no cloud dependency, free

## Decision

We replaced Claude Code with **opencode** as the primary AI-assisted development environment, using **local models** for all AI-assisted operations:

1. **Tool**: opencode (open-source AI development CLI)
2. **Models**: Local models via Ollama or similar local inference runtime
3. **Configuration**: Project conventions documented in `AGENTS.md` (replacing previous `CLAUDE.md`)
4. **Commands**: Slash commands adapted to opencode's command system
5. **Safety Hooks**: Git hook scripts preserved and adapted for opencode's hook system

### Implementation Details

- **Project Conventions** (`AGENTS.md`):
  - Project-specific instructions and coding standards
  - Development commands and quality gate expectations
  - Architecture patterns and best practices
  - Testing patterns and troubleshooting guides
  - Replaces the previous Claude-specific configuration file

- **Custom Commands** (`.github/scripts/` and project scripts):
  - `/analyze-and-fix-github-issue` — Complete workflow for fixing GitHub issues
  - `/release` — Automated release process via Changesets
  - `/update-dependencies` — Update dependencies with PR workflow

- **Safety Hooks** (`.github/hooks/`):
  - `block-git-no-verify.ts` — Prevents bypassing of git hooks
  - Protection against destructive operations
  - Validation of automated changes
  - User confirmation for critical operations

- **Local Model Setup**:
  - Models run entirely on developer hardware via Ollama or equivalent
  - No network calls for code context or completions
  - Model selection is developer-specific (e.g., Qwen, Llama, Mistral)
  - Configuration managed per-project via opencode settings

- **Workflow Patterns** (unchanged from previous setup):
  - Issue-driven development with specifications
  - Automated PR creation with proper descriptions
  - Test-driven implementation approach
  - Comprehensive validation before commits
  - Changeset management for releases

- **Integration Points**:
  - GitHub CLI for repository operations
  - Local model inference runtime (Ollama, etc.)
  - CI/CD pipeline for validation (unchanged)

## Consequences

### Positive

- **No Vendor Lock-in**: Open-source tooling, no dependency on any single vendor
- **Data Privacy**: Source code and project context never leave the developer's machine
- **Cost**: Zero ongoing subscription costs for AI-assisted development
- **Offline Capability**: Development continues without internet connectivity
- **Transparency**: Full visibility into model behavior and prompts
- **Flexibility**: Developers can choose models that fit their hardware and needs
- **Security**: No risk of data exfiltration or cloud-based model training on project code
- **Availability**: No external service outages impact development

### Negative

- **Hardware Requirements**: Local models require sufficient CPU/RAM/GPU resources
- **Performance**: Local models may be slower than cloud alternatives for large contexts
- **Model Quality**: Open-source models may not match the capability of proprietary models on certain tasks
- **Setup Complexity**: Developers must install and configure local model runtimes
- **Model Selection**: No single "best" model — developers must evaluate tradeoffs

### Mitigation

- **Hardware Guidelines**: Document minimum hardware requirements for smooth operation
- **Model Recommendations**: Provide recommended models for different hardware tiers
- **Fallback Procedures**: Clear manual processes for when AI assistance is unavailable
- **Documentation**: Comprehensive setup guides for local model installation and configuration
- **Incremental Adoption**: Start with smaller models, scale up as hardware permits
- **Performance Tuning**: Document model quantization and optimization techniques

## References

- [opencode Documentation](https://opencode.ai)
- [ADR-0012: Claude Code Development Environment](./0012-claude-code-development-environment.md) — _Superseded by this ADR_
- [AGENTS.md](../../../AGENTS.md) — Project conventions and quality gates
- [Ollama Documentation](https://ollama.com/)
