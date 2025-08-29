---
'agentic-node-ts-starter': patch
---

fix: add actionlint installation to reusable validate workflow

- Install actionlint in CI using official download script from rhysd/actionlint
- Add workflow linting step to validation pipeline after format checking
- Ensures lint:workflows script works properly in CI environments
- Uses the same validation that runs locally via precommit hooks
