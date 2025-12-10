# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated CI/CD processes in the Magic Mock monorepo.

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Triggers:** Pull requests and pushes to `master` branch

**Purpose:** Validates code quality, runs tests, and ensures all packages build successfully before merging.

**Jobs:**
- **validate**: Lints code and runs type checking
- **build**: Builds all packages in the monorepo
- **test**: Runs unit tests for all packages
- **e2e**: Runs Playwright end-to-end tests
- **changeset-check**: Warns if package changes don't have a changeset (non-blocking)
- **all-checks-passed**: Meta-job that ensures all required checks passed

**Required Status Checks:**
Configure branch protection rules to require the "All Checks Passed" job before merging PRs.

### 2. Release Workflow (`release.yml`)

**Triggers:** Push to `master` branch (typically after PR merges)

**Purpose:** Automatically versions packages and publishes them to npm using changesets.

**Process:**
1. Checks for pending changesets in `.changeset/` directory
2. If changesets exist:
   - Builds packages (lint and tests were already validated in CI before merge)
   - Versions packages using `pnpm changeset:version`
   - Publishes packages to npm using `pnpm changeset:publish`
   - Creates GitHub releases with changelog entries
   - Validates packages are available on npm registry

**Safety Features:**
- Prevents infinite loops by checking commit messages
- Uses concurrency controls to prevent race conditions
- Validates published packages are accessible
- Creates GitHub releases automatically
- Includes npm provenance for supply chain security

### 3. Claude Code Workflow (`claude.yml`)

**Triggers:** Comments, issues, or PR reviews mentioning `@claude`

**Purpose:** Enables Claude Code AI assistant to help with code reviews and development tasks.

### 4. Claude Code Review Workflow (`claude-code-review.yml`)

**Triggers:** Pull requests events

**Purpose:** Automated code review assistance using Claude Code.

## Composite Actions

The workflows use reusable composite actions located in `.github/actions/` to reduce duplication and improve maintainability.

### 1. Setup Node Environment (`setup-node-env`)

**Location:** `.github/actions/setup-node-env/action.yml`

**Purpose:** Performs the standard Node.js environment setup required for all jobs:
- Checks out the repository with full git history
- Installs pnpm package manager (v9)
- Sets up Node.js (v22.12.0) with caching
- Installs dependencies with frozen lockfile

**Inputs:**
- `registry-url` (optional): npm registry URL for publishing (e.g., `https://registry.npmjs.org`)
  - **When to use:** Set this when the job needs to publish to npm
  - **Default:** Empty (no registry configuration)
- `checkout-token` (optional): GitHub token for checkout
  - **When to use:** Set to `${{ secrets.GITHUB_TOKEN }}` when the job needs to push commits (e.g., release workflow)
  - **Default:** `${{ github.token }}` (read-only access)
- `install-timeout` (optional): Timeout in minutes for `pnpm install`
  - **When to use:** Increase for workflows with slow network or large dependencies
  - **Default:** `5` minutes

**Usage Examples:**

```yaml
# Standard usage (CI jobs)
- name: Setup Node env
  uses: ./.github/actions/setup-node-env

# For npm publishing (Release workflow)
- name: Setup Node env for publishing
  uses: ./.github/actions/setup-node-env
  with:
    registry-url: 'https://registry.npmjs.org'
    checkout-token: ${{ secrets.GITHUB_TOKEN }}
    install-timeout: '10'
```

**Used in:**
- `ci.yml` - All jobs (validate, build, test, e2e, changeset-check)
- `release.yml` - Release job with npm publishing configuration

### 2. Configure Git (`configure-git`)

**Location:** `.github/actions/configure-git/action.yml`

**Purpose:** Configures Git user identity for automated commits. Uses the `github-actions[bot]` identity by default for commits made by GitHub Actions.

**Inputs:**
- `user-name` (optional): Git user name
  - **Default:** `github-actions[bot]`
- `user-email` (optional): Git user email
  - **Default:** `github-actions[bot]@users.noreply.github.com`

**Usage Examples:**

```yaml
# Standard usage (default bot identity)
- name: Configure Git
  uses: ./.github/actions/configure-git

# Custom identity (if needed)
- name: Configure Git
  uses: ./.github/actions/configure-git
  with:
    user-name: 'Custom Bot'
    user-email: 'custom-bot@example.com'
```

**Used in:**
- `release.yml` - Before creating version commits with changesets

**When to use this action:**
- Before any workflow step that creates commits (e.g., version bumps, automated fixes)
- Ensures consistent authorship for automated commits
- Prevents Git from failing with "Please tell me who you are" errors

## Setup Instructions

### Required Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

#### `NPM_TOKEN`
**Required for:** Publishing packages to npm

**How to create:**
1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to Account Settings → Access Tokens
3. Click "Generate New Token" → "Automation Token"
4. Copy the token and add it as `NPM_TOKEN` in GitHub secrets

**Important:** Use an "Automation" token, not a "Publish" token, for CI/CD workflows.

#### `GITHUB_TOKEN`
**Automatically available** - No setup required. This is provided by GitHub Actions.

#### `CLAUDE_CODE_OAUTH_TOKEN` (Optional)
**Required for:** Claude Code workflows

**How to create:** Follow the [Claude Code Action documentation](https://github.com/anthropics/claude-code-action)

### NPM Access Configuration

Ensure the npm packages have proper access configuration:

1. **Organization Scope:** If publishing to `@magicmock` scope, ensure you have access to the npm organization
2. **Public Access:** Both packages have `"publishConfig": { "access": "public" }` in their `package.json`
3. **Package Names:**
   - `@magicmock/core`
   - `@magicmock/unplugin`

### Branch Protection Rules

Configure branch protection for `master`:

1. Go to Settings → Branches → Branch protection rules
2. Add rule for `master` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Add required status check: "All Checks Passed"
   - ✅ Do not allow bypassing the above settings

## Release Process

### For Contributors

When making changes that should be released:

1. **Make your changes** in a feature branch
2. **Add a changeset** describing the changes:
   ```bash
   pnpm changeset
   ```
   - Select which packages are affected
   - Choose the version bump type (major/minor/patch)
   - Write a user-facing description of the changes

3. **Commit the changeset** along with your changes:
   ```bash
   git add .changeset/*.md
   git commit -m "feat: add new feature"
   ```

4. **Create a pull request** - CI will run automatically

5. **Merge the PR** after approval and passing checks

### Automatic Publishing

After PR merge to `master`:

1. The `release.yml` workflow triggers automatically
2. If changesets are present:
   - Packages are versioned according to changesets
   - `CHANGELOG.md` files are updated
   - Version commit is created: "ci: version packages"
   - Packages are built and published to npm
   - GitHub releases are created with changelogs
   - Published packages are validated

3. If no changesets exist, workflow skips publishing

### Manual Publishing (Emergency)

If you need to publish manually:

```bash
# Ensure everything is built and tested
pnpm install
pnpm build
pnpm test

# Version packages (this consumes changesets)
pnpm changeset:version

# Commit the version changes
git add .
git commit -m "ci: version packages"
git push

# Publish to npm (requires NPM_TOKEN)
npm login
pnpm changeset:publish

# Push tags
git push --follow-tags
```

## Workflow Optimization

### Caching Strategy

The workflows use multiple caching mechanisms:

1. **pnpm cache**: Automatically cached by `setup-node` action
2. **Build outputs**: Cached between jobs to avoid rebuilding
3. **Playwright browsers**: Installed once and reused

### Parallelization

The CI workflow runs jobs in parallel where possible:
- `validate`, `build` run first (parallel)
- `test`, `e2e` wait for `build` to complete (parallel after build)

### Timeouts

All long-running steps have timeouts to prevent hanging workflows:
- Install: 10 minutes
- Lint: 5 minutes
- Build: 10 minutes
- Tests: 10 minutes
- E2E: 15 minutes

## Troubleshooting

### Release workflow not publishing

**Check:**
1. Are there changesets in `.changeset/` directory?
2. Is `NPM_TOKEN` secret configured correctly?
3. Check workflow logs for specific errors

### npm authentication errors

**Solutions:**
1. Regenerate `NPM_TOKEN` with "Automation" type
2. Ensure the token has publish permissions
3. Verify the npm organization access

### Build failures after merge

**Solutions:**
1. Ensure the PR passed all CI checks before merging
2. Check for conflicts with recent changes
3. Manually run: `pnpm install && pnpm build && pnpm test`

### E2E tests failing in CI but passing locally

**Common causes:**
1. Missing Playwright browser dependencies
2. Race conditions in tests (add proper waits)
3. Different screen sizes (configure viewport in tests)

### Changeset version conflicts

If multiple PRs with changesets merge:
1. The first merge will version and publish
2. Subsequent merges will create new changesets
3. Next push will batch them together

## Advanced Configuration

### Customizing the Release Process

Edit `.github/workflows/release.yml`:

```yaml
# Change Node.js version
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.19.0' # Change this

# Add additional validation steps
- name: Custom validation
  run: |
    # Your custom commands
```

### Adding Pre-publish Checks

Add steps before the "Create Release Pull Request or Publish" step:

```yaml
- name: Custom pre-publish check
  run: |
    # Example: Check bundle size
    pnpm -r exec npm pack --dry-run
```

### Configuring Changesets

Edit `.changeset/config.json`:

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "master",
  "updateInternalDependencies": "patch"
}
```

## Monitoring

### Workflow Status

- View workflow runs: Actions tab in GitHub
- Check specific job logs for debugging
- Download artifacts (Playwright reports) for failed E2E tests

### npm Package Status

After publishing, verify:
1. Package appears on [npmjs.com](https://www.npmjs.com/package/@magicmock/core)
2. Version number matches the release
3. Files are included correctly (`dist/` directory)

### GitHub Releases

- Releases created automatically at: `github.com/[user]/magic-mock/releases`
- Each package gets a separate release: `@magicmock/core@1.0.0`
- Includes changelog extracted from `CHANGELOG.md`

## Security Considerations

1. **Minimal Token Permissions**: Workflows use minimal required permissions
2. **Secrets Management**: Never log `NPM_TOKEN` or other secrets
3. **npm Provenance**: Enabled for supply chain security (verifiable builds)
4. **Dependency Scanning**: Consider adding Dependabot for automatic updates
5. **Lock Files**: Always use `--frozen-lockfile` to ensure reproducible builds

## Further Reading

- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
