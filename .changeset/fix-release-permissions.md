---
'agentic-node-ts-starter': patch
---

fix: document GitHub Actions permissions requirement for release workflow

- Add clear documentation about required repository settings
- Add comments in release workflow about permissions requirement
- Add issues write permission for better GitHub integration
- Update README, CONTRIBUTING, and CLAUDE documentation

This fixes the release workflow failure by documenting that repository
administrators must enable "Allow GitHub Actions to create and approve
pull requests" in Settings → Actions → General.
