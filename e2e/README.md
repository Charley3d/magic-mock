# Magic Mock E2E Tests

Comprehensive end-to-end test suite for all Magic Mock example projects using Playwright.

## Overview

This test suite validates the Pokemon Explorer application across four different integration patterns:

1. **simple-axios** - Standalone HTML with Axios HTTP library
2. **simple-jquery** - Standalone HTML with jQuery and XMLHttpRequest
3. **cli-vue** - Vue CLI + Webpack bundler setup
4. **vite-vue** - Vite + Vue 3 with TypeScript

All examples share the same core functionality, allowing us to test consistent behavior across different build toolchains and HTTP client libraries.

## Test Structure

```
e2e/
├── helpers/
│   ├── pokemon-helpers.ts       # Shared test utilities for Pokemon Explorer
│   └── magic-mock-helpers.ts    # Utilities for testing Magic Mock modes
├── simple-axios/
│   └── pokemon-explorer.spec.ts # Tests for Axios example
├── simple-jquery/
│   └── pokemon-explorer.spec.ts # Tests for jQuery example
├── cli-vue/
│   └── pokemon-explorer.spec.ts # Tests for Vue CLI example
└── vite-vue/
    ├── pokemon-explorer.spec.ts # Tests for Vite + Vue example
    └── magic-mock-modes.spec.ts # Magic Mock recording/mocking tests
```

## Test Coverage

### Core Functionality Tests (100% coverage)

Each example includes identical tests for:

- **Initial page state**: Verify all UI elements are present and properly configured
- **Dropdown interaction**: Test selecting different Pokemon counts (1, 5, 10, 25, 50)
- **Fetch functionality**: Click fetch button and verify correct number of Pokemon are loaded
- **Pokemon cards**: Validate all card elements (image, name, type badges, height, weight)
- **Stats display**: Verify count and timing information is accurate
- **Loading states**: Confirm button/dropdown are disabled during fetch
- **Sequential fetching**: Test multiple fetches with different counts
- **Grid layout**: Verify CSS Grid is properly applied

### Performance Tests

- **Timing validation**: Verify stats calculation is accurate
- **Large dataset handling**: Test fetching 25+ Pokemon
- **Average time calculation**: Validate math correctness

### Framework-Specific Tests

**Vue Examples (cli-vue, vite-vue):**
- Button text changes to "Fetching..." during load
- Both dropdown and button are disabled during fetch
- Vue-specific green color theme (#42b883)
- Reactive data updates correctly

**Simple Examples (simple-axios, simple-jquery):**
- Basic button disable during fetch
- XHR/Fetch request interception validation

**Vite-Vue Specific:**
- TypeScript interface validation
- HMR capability detection

### Magic Mock Mode Tests (vite-vue only)

The `magic-mock-modes.spec.ts` file tests Magic Mock's core functionality:

- **Record Mode**: Verify real API calls are made and cached
- **Mock Mode**: Verify cached responses are served instantly
- **Off Mode**: Verify requests bypass Magic Mock
- **Performance Comparison**: Measure speedup from Record to Mock mode (typically 10x+)
- **Mode Switching**: Test transitioning between modes
- **Cache Consistency**: Verify mocked responses are fast and consistent

## Running Tests

### Prerequisites

1. Install dependencies from the monorepo root:
   ```bash
   pnpm install
   ```

2. Build the packages:
   ```bash
   pnpm build
   ```

3. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

### Run All Tests

Run the complete test suite across all four examples:

```bash
pnpm test:e2e
```

### Run Tests for Specific Example

```bash
# Simple Axios example
pnpm test:e2e:simple-axios

# Simple jQuery example
pnpm test:e2e:simple-jquery

# CLI Vue example
pnpm test:e2e:cli-vue

# Vite Vue example
pnpm test:e2e:vite-vue
```

### Interactive UI Mode

Launch Playwright's UI mode for debugging and watching tests:

```bash
pnpm test:e2e:ui
```

### Headed Mode (See Browser)

Run tests with browser windows visible:

```bash
pnpm test:e2e:headed
```

### Debug Mode

Debug tests with Playwright Inspector:

```bash
pnpm test:e2e:debug
```

### View HTML Report

After running tests, view the HTML report:

```bash
pnpm test:e2e:report
```

## Configuration

The Playwright configuration is located at `/playwright.config.ts`. Key features:

- **Separate projects**: Each example has its own project with dedicated webServer config
- **Automatic server startup**: Playwright starts dev servers automatically
- **Parallel execution**: Tests run in parallel for faster execution
- **Smart retries**: Auto-retry on CI environments
- **Rich reporting**: HTML, list, and JSON reporters
- **Failure artifacts**: Screenshots and videos captured on test failures

### Web Server Configuration

Each example uses a different server setup:

| Example | Port | Command | Server |
|---------|------|---------|--------|
| simple-axios | 3001 | `npx http-server` | Static file server |
| simple-jquery | 3002 | `npx http-server` | Static file server |
| cli-vue | 8080 | `pnpm serve` | Vue CLI dev server |
| vite-vue | 5173 | `pnpm dev` | Vite dev server |

## Writing Tests

### Using Shared Helpers

The test suite provides reusable helpers to avoid code duplication:

```typescript
import {
  waitForPageReady,
  verifyInitialPageState,
  selectPokemonCount,
  fetchPokemon,
  verifyPokemonCards,
  verifyStats,
  testPokemonCount,
} from '../helpers/pokemon-helpers';

test('should fetch 5 Pokemon', async ({ page }) => {
  await page.goto('/');
  await waitForPageReady(page);
  await testPokemonCount(page, 5);
});
```

### Testing Magic Mock Modes

For examples with Magic Mock plugin integration:

```typescript
import {
  setMagicMockMode,
  clearMagicMockCache,
  MagicMockMode,
} from '../helpers/magic-mock-helpers';

test('should record then mock', async ({ page }) => {
  await clearMagicMockCache(page);

  // Record mode
  await setMagicMockMode(page, MagicMockMode.RECORD);
  await fetchPokemon(page);

  // Mock mode
  await setMagicMockMode(page, MagicMockMode.MOCK);
  await fetchPokemon(page); // Much faster!
});
```

### Best Practices

1. **Use Playwright's auto-waiting**: Never use fixed `setTimeout`, rely on Playwright's built-in waiting
2. **Test user behavior**: Focus on what users see and interact with, not implementation details
3. **Leverage shared helpers**: Use the helpers in `/e2e/helpers/` to keep tests DRY
4. **Clear, descriptive test names**: Use full sentences that explain the scenario
5. **Verify visible outcomes**: Assert on DOM state, displayed text, and visual elements
6. **Handle async properly**: Always await async operations and use Playwright's assertions

## Selectors

All shared selectors are defined in `pokemon-helpers.ts`:

```typescript
export const SELECTORS = {
  pokemonCountDropdown: '#pokemonCount',
  fetchButton: 'button:has-text("Fetch Pokemon")',
  resultContainer: '.result, #result',
  pokemonCard: '.pokemon-card',
  pokemonName: '.pokemon-name',
  typeBadge: '.type-badge',
  // ... more selectors
};
```

These selectors are resilient to minor UI changes and work across all examples.

## Debugging Failed Tests

### 1. View Trace

Playwright captures traces on first retry. View them with:

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 2. Check Screenshots

Failed tests automatically capture screenshots in `test-results/`

### 3. Watch Video

Videos are captured on failure in `test-results/`

### 4. Run in Debug Mode

```bash
pnpm test:e2e:debug --project=vite-vue
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- Inspect the page at each step
- Try out selectors in the console

### 5. Console Logs

Add console.log statements to output test information:

```typescript
test('debug test', async ({ page }) => {
  const timing = await extractTiming(page);
  console.log(`Timing: ${timing.totalTime}ms`);
});
```

## CI/CD Integration

The test suite is CI-ready:

- **No parallel execution on CI**: `workers: 1` prevents resource conflicts
- **Automatic retries**: Failed tests retry twice on CI
- **No server reuse on CI**: Fresh servers for each run
- **forbidOnly**: Prevents accidental `test.only()` commits

### Example GitHub Actions

```yaml
- name: Install dependencies
  run: pnpm install

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Build packages
  run: pnpm build

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Extending the Test Suite

### Adding a New Example

1. Create a new directory in `/e2e/[example-name]/`
2. Add a test file: `pokemon-explorer.spec.ts`
3. Use the shared helpers from `/e2e/helpers/`
4. Add project configuration to `playwright.config.ts`:

```typescript
{
  name: 'my-example',
  testDir: './e2e/my-example',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3003',
  },
  webServer: {
    command: 'cd examples/my-example && pnpm dev',
    port: 3003,
    reuseExistingServer: !process.env.CI,
  },
}
```

5. Add npm script to `package.json`:

```json
"test:e2e:my-example": "playwright test --project=my-example"
```

### Adding New Test Helpers

Add reusable test logic to `/e2e/helpers/`:

```typescript
// e2e/helpers/my-helpers.ts
export async function myCustomHelper(page: Page) {
  // Shared test logic
}
```

Then import in your tests:

```typescript
import { myCustomHelper } from '../helpers/my-helpers';
```

## Performance Benchmarks

Expected timing ranges (approximate):

| Mode | 5 Pokemon | 10 Pokemon | 25 Pokemon |
|------|-----------|------------|------------|
| Record (Real API) | 500-2000ms | 1000-4000ms | 2500-10000ms |
| Mock (Cached) | 5-50ms | 10-100ms | 25-250ms |
| Speedup | 10-40x | 10-40x | 10-40x |

Note: Real API times depend on network speed and PokéAPI response times.

## Troubleshooting

### Tests fail with "Timeout waiting for page load"

- Increase the timeout in `playwright.config.ts`
- Check that the dev server starts successfully
- Verify the correct port is configured

### Tests pass locally but fail on CI

- Ensure `reuseExistingServer` is false on CI
- Add `--workers=1` flag on CI to prevent parallel conflicts
- Increase timeouts for slower CI environments

### "Target closed" errors

- The application crashed during the test
- Check browser console logs in the trace viewer
- Look for JavaScript errors in the app

### Flaky tests (sometimes pass, sometimes fail)

- Avoid fixed timeouts - use Playwright's auto-waiting
- Ensure selectors are unique and stable
- Add explicit waits for async operations

### Magic Mock tests skipping

- Magic Mock HUD is not initialized (plugin not configured)
- This is expected for simple examples without the plugin

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Test Assertions](https://playwright.dev/docs/test-assertions)
