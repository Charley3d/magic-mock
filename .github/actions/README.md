# Composite Actions

This directory contains reusable composite actions that are shared across multiple workflows in this repository.

## Available Actions

### setup-node-env

**Purpose:** Standard Node.js environment setup for all CI/CD jobs.

**What it does:**
1. Checks out the repository with full git history (`fetch-depth: 0`)
2. Installs pnpm package manager (version 9)
3. Sets up Node.js (version 22.12.0) with pnpm caching
4. Installs dependencies using `pnpm install --frozen-lockfile`

**When to use:**
- At the beginning of any job that needs to run pnpm scripts
- Required before running build, test, lint, or any package commands

**Inputs:**

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `registry-url` | No | `''` (empty) | npm registry URL for publishing. Set to `https://registry.npmjs.org` when publishing to npm. |
| `checkout-token` | No | `${{ github.token }}` | GitHub token for checkout. Use `${{ secrets.GITHUB_TOKEN }}` when pushing commits. |
| `install-timeout` | No | `'5'` | Timeout in minutes for `pnpm install` step. Increase for slow networks. |

**Example - Basic usage (CI):**
```yaml
- name: Setup Node env
  uses: ./.github/actions/setup-node-env
```

**Example - For npm publishing (Release):**
```yaml
- name: Setup Node env for publishing
  uses: ./.github/actions/setup-node-env
  with:
    registry-url: 'https://registry.npmjs.org'
    checkout-token: ${{ secrets.GITHUB_TOKEN }}
    install-timeout: '10'
```

### configure-git

**Purpose:** Configure Git user identity for automated commits.

**What it does:**
- Sets `git config user.name` and `git config user.email`
- Uses github-actions bot identity by default

**When to use:**
- Before any workflow step that creates commits (e.g., version bumps, auto-fixes)
- Prevents "Please tell me who you are" Git errors
- Ensures consistent authorship for automated commits

**Inputs:**

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `user-name` | No | `github-actions[bot]` | Git user name for commits |
| `user-email` | No | `github-actions[bot]@users.noreply.github.com` | Git user email for commits |

**Example - Standard usage:**
```yaml
- name: Configure Git
  uses: ./.github/actions/configure-git
```

**Example - Custom identity:**
```yaml
- name: Configure Git
  uses: ./.github/actions/configure-git
  with:
    user-name: 'Release Bot'
    user-email: 'release-bot@example.com'
```

## Creating New Composite Actions

When creating a new composite action, follow these best practices:

1. **Structure:**
   - Create a new directory: `.github/actions/<action-name>/`
   - Add `action.yml` file in that directory
   - Optionally add a `README.md` for complex actions

2. **Required fields in action.yml:**
   ```yaml
   name: 'Action Name'
   description: 'Clear description of what this action does'

   inputs:
     input-name:
       description: 'Description of the input'
       required: false
       default: 'default-value'

   runs:
     using: composite
     steps:
       - run: echo "Your commands here"
         shell: bash
   ```

3. **Best practices:**
   - Use `shell: bash` for all `run` steps (required for composite actions)
   - Document all inputs with descriptions and defaults
   - Keep actions focused on a single responsibility
   - Add clear names and comments to steps
   - Consider adding outputs if the action produces useful data
   - Test the action in a workflow before committing

4. **Inputs best practices:**
   - Provide sensible defaults when possible
   - Use string types for all inputs (GitHub Actions limitation)
   - Convert strings to other types in the action: `${{ fromJSON(inputs.number-input) }}`
   - Document when to use each input in the description

5. **Common patterns:**
   - **Conditional behavior:** Use `${{ inputs.some-input != '' && inputs.some-input || null }}`
   - **Timeouts:** Use `timeout-minutes: ${{ fromJSON(inputs.timeout) }}`
   - **Boolean flags:** Convert strings: `${{ inputs.flag == 'true' }}`

## Usage in Workflows

To use a composite action from this repository:

```yaml
- name: Descriptive step name
  uses: ./.github/actions/<action-name>
  with:
    input-name: 'value'
```

**Important notes:**
- Always use the relative path `./.github/actions/<action-name>`
- The repository must be checked out first (unless the action does checkout itself)
- Inputs are passed via the `with:` block
- Secrets must be explicitly passed if needed (not automatically inherited)

## Benefits of Composite Actions

1. **DRY Principle:** Avoid duplicating setup code across workflows
2. **Consistency:** Ensure all jobs use the same setup process
3. **Maintainability:** Update once, apply everywhere
4. **Clarity:** Workflows become more readable and focused on business logic
5. **Reusability:** Share common patterns across different workflow types

## Current Usage

### setup-node-env
- Used in `ci.yml`: All jobs (validate, build, test, e2e, changeset-check)
- Used in `release.yml`: Release job with npm publishing configuration

### configure-git
- Used in `release.yml`: Before creating version commits with changesets

## Further Reading

- [GitHub Actions: Creating composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [GitHub Actions: Inputs for composite actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
- [GitHub Actions: Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
