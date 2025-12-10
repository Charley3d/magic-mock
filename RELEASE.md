# Release Guide

This document explains how the automated release process works for Magic Mock packages.

## Quick Start

### For Contributors

When you make changes that should be published:

```bash
# 1. Make your changes
git checkout -b feature/my-feature

# 2. Add a changeset
pnpm changeset

# 3. Commit everything
git add .
git commit -m "feat: add my feature"

# 4. Push and create PR
git push -u origin feature/my-feature
```

That's it! Once your PR is merged, packages will be automatically published to npm.

## How It Works

### The Changeset Workflow

1. **Developer adds changeset**: Run `pnpm changeset` to describe your changes
2. **Changeset committed**: The `.changeset/*.md` file is committed with your code
3. **PR merged**: After approval and CI passes, PR is merged to `master`
4. **Automatic release**: GitHub Actions workflow automatically:
   - Versions packages based on changesets
   - Updates CHANGELOG.md files
   - Publishes to npm
   - Creates GitHub releases
   - Validates published packages

### What Gets Published

Only the packages in `packages/` directory:
- `@magicmock/core`
- `@magicmock/unplugin`

Examples are NOT published (they're for testing/documentation only).

## Creating a Changeset

Run `pnpm changeset` and follow the prompts:

```bash
pnpm changeset
```

You'll be asked:

1. **Which packages changed?** Select the affected packages (use Space to select, Enter to continue)
2. **What type of change?** Choose:
   - **patch** (0.0.X) - Bug fixes, minor changes
   - **minor** (0.X.0) - New features, backward compatible
   - **major** (X.0.0) - Breaking changes
3. **Summary**: Write a user-facing description

### Changeset Best Practices

**Good changeset summaries:**
- "Add support for WebSocket request interception"
- "Fix issue where XHR requests with FormData were not recorded correctly"
- "Update API to use async/await pattern (breaking change)"

**Bad changeset summaries:**
- "Fix bug" (too vague)
- "Update code" (not user-facing)
- "WIP" (not descriptive)

### When to Add a Changeset

**YES - Add a changeset for:**
- New features
- Bug fixes
- Performance improvements
- API changes
- Documentation changes in published packages

**NO - Skip changeset for:**
- Test updates
- Example changes
- Internal refactoring with no user impact
- README updates in the root
- CI/CD configuration changes

## Release Types

### Automatic Release (Recommended)

**Triggers:** Push to `master` branch with changesets

**Process:**
1. Merge PR with changeset
2. GitHub Actions automatically publishes
3. Monitor the "Release" workflow in Actions tab

**Timeline:** Typically completes in 5-10 minutes

### Manual Release (Emergency Only)

If the automatic workflow fails, you can release manually:

```bash
# 1. Ensure everything is clean
git checkout master
git pull origin master

# 2. Install and build
pnpm install
pnpm build
pnpm test

# 3. Version packages
pnpm changeset:version

# 4. Commit version changes
git add .
git commit -m "ci: version packages"

# 5. Publish to npm
npm login  # Use automation token
pnpm changeset:publish

# 6. Push changes and tags
git push --follow-tags
```

## Versioning Strategy

Magic Mock follows [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes
  - API changes that require code updates
  - Removing deprecated features
  - Changing default behavior

- **Minor (0.X.0)**: New features
  - Adding new functionality
  - Enhancing existing features
  - New exports or APIs

- **Patch (0.0.X)**: Bug fixes
  - Fixing broken functionality
  - Performance improvements
  - Security patches

### Pre-1.0 Versioning

Currently at version 0.x.x, so:
- Breaking changes → minor bump
- New features → minor bump
- Bug fixes → patch bump

After reaching 1.0.0, standard semver applies.

## Package Dependencies

`@magicmock/unplugin` depends on `@magicmock/core`:

```json
{
  "dependencies": {
    "@magicmock/core": "workspace:*"
  }
}
```

When releasing:
- If both packages have changesets, both are versioned and published
- If only `core` changes, `unplugin` gets a patch bump (due to dependency update)
- This is controlled by `.changeset/config.json`: `"updateInternalDependencies": "patch"`

## Monitoring Releases

### During Release

1. Go to GitHub → Actions → Release workflow
2. Watch the job progress
3. Check for any errors in the logs

### After Release

Verify the release succeeded:

1. **npm Registry**: Check [npmjs.com](https://www.npmjs.com/package/@magicmock/core)
   ```bash
   npm view @magicmock/core version
   npm view @magicmock/unplugin version
   ```

2. **GitHub Releases**: Check the Releases page
   - Should show new releases with changelogs

3. **Test Installation**: Try installing the new version
   ```bash
   npm install @magicmock/core@latest
   ```

## Rollback Process

If a bad release is published:

### Option 1: Publish a Fix (Recommended)

```bash
# 1. Fix the issue in a new PR
# 2. Add a changeset with patch bump
# 3. Merge to master
# 4. Automatic release publishes the fix
```

### Option 2: Deprecate Version

```bash
# Deprecate the bad version on npm
npm deprecate @magicmock/core@X.Y.Z "Deprecated due to [reason]. Use X.Y.Z+1 instead."
```

### Option 3: Unpublish (Last Resort)

**Only within 72 hours of publishing:**

```bash
npm unpublish @magicmock/core@X.Y.Z
```

**Warning:** Unpublishing breaks anyone who installed the version. Use sparingly.

## Troubleshooting

### "No changesets found - skipping release"

**Cause:** No `.changeset/*.md` files in the repository

**Solution:** Add a changeset with `pnpm changeset` before merging

### "npm authentication failed"

**Cause:** Missing or invalid `NPM_TOKEN` secret

**Solution:**
1. Generate a new automation token on npmjs.com
2. Add it as `NPM_TOKEN` in GitHub secrets
3. Re-run the workflow

### "Version conflict"

**Cause:** Multiple changesets trying to version the same package differently

**Solution:** Changesets will batch them together using the highest version bump

### "Package already exists"

**Cause:** Trying to publish a version that already exists on npm

**Solution:**
1. Check if version was already published
2. If duplicate, skip or create a new changeset for next version

### "Permission denied"

**Cause:** npm account doesn't have publish access to `@magicmock` scope

**Solution:**
1. Ensure you're added as a maintainer to the npm organization
2. Verify package access with `npm access list packages`

## CI/CD Architecture

### Workflow Files

- **`.github/workflows/ci.yml`**: Runs on PRs - validates code quality
- **`.github/workflows/release.yml`**: Runs on master push - publishes packages

### CI Pipeline

```
PR Created
    ↓
Lint → Build → Test → E2E → Changeset Check
    ↓
All Checks Passed ✅
    ↓
PR Merged to master
    ↓
Release Workflow Triggered
    ↓
Check for Changesets → Lint → Build → Test
    ↓
Version → Publish → GitHub Release → Validation
    ↓
Packages Available on npm ✅
```

### Security Features

- **npm Provenance**: Links packages to source code
- **Minimal Permissions**: Workflows use least privilege
- **Secret Management**: Tokens never logged
- **Lock Files**: Frozen lockfile ensures reproducible builds

## Advanced Topics

### Testing Before Release

To test the release process locally:

```bash
# Dry run versioning
pnpm changeset:version

# Check what would be published
cd packages/core
npm pack --dry-run

cd ../unplugin
npm pack --dry-run
```

### Skipping CI

**Never skip CI on master!** All releases should pass tests.

For emergencies only:
```bash
git commit -m "fix: emergency patch [skip ci]"
```

### Pre-release Versions

For alpha/beta releases, use changeset prerelease mode:

```bash
# Enter prerelease mode
pnpm changeset pre enter alpha

# Create changeset
pnpm changeset

# Version and publish
pnpm changeset:version
pnpm changeset:publish

# Exit prerelease mode
pnpm changeset pre exit
```

### Multiple Changesets in One PR

You can add multiple changesets in a single PR:

```bash
# First change
pnpm changeset  # for package A

# Second change
pnpm changeset  # for package B

# Both will be included in the same PR
```

They'll be batched together when the PR merges.

## Getting Help

- **Changesets Docs**: https://github.com/changesets/changesets
- **Workflow Issues**: Check `.github/workflows/README.md`
- **npm Publishing**: https://docs.npmjs.com/
- **GitHub Actions**: Check the Actions tab for logs

## Summary

The automated release process makes publishing safe and easy:

1. Add changeset: `pnpm changeset`
2. Commit and create PR
3. Merge after approval
4. Automatic publishing happens
5. Monitor in Actions tab

That's it! The CI/CD pipeline handles the rest.
