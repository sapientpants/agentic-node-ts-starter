# Release a new version

This project uses an **automated release process** powered by Changesets. Releases happen automatically when changes with changesets are merged to the main branch.

## How Releases Work

### Automatic Release Process

1. **During Development**: When you make changes, add a changeset:

   ```bash
   pnpm changeset
   ```

   - Select the type of change (patch/minor/major)
   - Provide a description for the changelog

2. **On PR Merge**: When your PR with a changeset is merged to main:
   - GitHub Actions automatically runs the release workflow
   - The workflow checks for pending changesets
   - If changesets exist, it automatically:
     - Updates version in `package.json`
     - Generates/updates `CHANGELOG.md`
     - Creates a git tag
     - Commits changes with `[skip actions]` to prevent loops
     - Creates a GitHub Release with artifacts
     - Publishes to npm (if configured)

3. **No Manual Steps Required**: The entire process is automated!

## Creating a Release

### Standard Release (Recommended)

All releases happen through pull requests:

```bash
# On your feature branch
pnpm changeset  # Add changeset for your changes
git add .
git commit -m "feat: your feature"
git push origin your-branch

# Create PR via GitHub CLI or web interface
gh pr create --title "feat: your feature" --body "Description"

# After PR review and approval, merge it
# Release happens automatically after merge!
```

### Hotfix Release

For urgent fixes, still use the PR process:

1. Create a hotfix branch from main
2. Make your fix and add a changeset
3. Create and merge PR with expedited review
4. The release workflow will automatically trigger after merge

### Monitoring Releases

Watch the release process:

```bash
# View recent workflow runs
gh run list --workflow=main.yml

# Watch a specific run
gh run watch <run-id>

# View releases
gh release list
```

## What Happens Automatically

When changesets are detected on main branch:

1. **Version Bump**: Based on changeset types (patch/minor/major)
2. **CHANGELOG Update**: Generated from changeset descriptions
3. **Git Tag**: Created as `v{version}`
4. **GitHub Release**: Created with:
   - Release notes from CHANGELOG
   - Build artifacts (dist files)
   - SBOM (Software Bill of Materials)
5. **NPM Publish**: If `NPM_TOKEN` secret is configured
6. **Attestations**: Build provenance for security

## Release Types

- **patch** (0.0.X): Bug fixes, documentation updates
- **minor** (0.X.0): New features, non-breaking changes
- **major** (X.0.0): Breaking changes

## Troubleshooting

### No Release Triggered

- Check if changesets exist: `ls .changeset/*.md`
- Verify changesets are not empty
- Check workflow runs: `gh run list --workflow=main.yml`

### Release Failed

- Check GitHub Actions logs
- Verify all tests pass: `pnpm verify`
- Ensure build succeeds: `pnpm build`

### Manual Version Bump (Not Recommended)

If absolutely necessary:

```bash
# This is handled automatically - avoid manual changes!
pnpm changeset version  # Updates version and CHANGELOG
```

## Important Notes

- **Always** use pull requests - never push directly to main
- **Never** manually edit version in `package.json`
- **Never** manually create release tags
- **Never** manually edit CHANGELOG.md (except for corrections)
- Always use changesets for version management
- The `[skip actions]` tag prevents release commit loops
- All releases must go through the PR review process

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Changeset guidelines
- [.github/workflows/main.yml](../../.github/workflows/main.yml) - Release workflow
- [Changesets Documentation](https://github.com/changesets/changesets) - Official docs
