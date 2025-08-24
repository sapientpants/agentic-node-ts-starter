---
'agentic-node-ts-starter': patch
---

feat: update release workflow with modern GitHub Release action and conditional NPM publishing

- Replace deprecated `actions/create-release@v1` with `softprops/action-gh-release@v2`
- Add conditional NPM publishing that only runs when NPM_TOKEN is configured
- Add informative logging when NPM publishing is skipped
- Maintain backward compatibility with existing release process
