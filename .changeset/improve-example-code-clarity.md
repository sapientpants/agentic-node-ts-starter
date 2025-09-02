---
'agentic-node-ts-starter': patch
---

docs: Improve clarity of example code marking in starter template

- Added prominent header comments to all example files (src/index.ts, tests/\*.spec.ts) marking them as "EXAMPLE CODE - REPLACE WITH YOUR IMPLEMENTATION"
- Added subtle header comments to template infrastructure files marking them as production-ready and customizable
- Updated GETTING_STARTED.md with an info box clearly distinguishing between example code to remove and template infrastructure to keep
- Added note to README.md explaining that the template includes marked example code
- All files now have clear visual indicators helping developers quickly identify what to keep vs. what to replace

This change addresses issue #97 by making it immediately apparent which files are examples versus production-ready template code, reducing confusion for new users adopting the starter template.
