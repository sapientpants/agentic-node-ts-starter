---
'agentic-node-ts-starter': minor
---

feat: add Claude command to fix SonarQube issues

Add `/fix-sonarqube-issues` command that automates the process of identifying and fixing SonarQube issues. The command first checks if issues exist before creating a branch, then fixes issues by priority (BLOCKER → CRITICAL → MAJOR → MINOR → INFO), validates changes, creates a changeset, commits, and creates a PR. Streamlines code quality improvements by automating the entire workflow from issue detection to PR creation.
