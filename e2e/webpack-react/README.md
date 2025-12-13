# E2E Tests for webpack-react Example

This directory contains end-to-end tests for the webpack-react example using Playwright.

## Test Overview

The webpack-react example demonstrates Magic Mock integration with React 18 and Webpack 5. These E2E tests verify that the magic-mock library works correctly in this environment.

### Test Focus

Following the magic-mock project guidelines, these tests focus EXCLUSIVELY on verifying magic-mock functionality:

1. **Mode Switching**: Verify the HUD toggle buttons work (Record and Mock modes)
2. **Request Interception**: Confirm requests are intercepted in Record and Mock modes
3. **Response Caching**: Verify responses are stored correctly during Record mode
4. **Mock Playback**: Verify cached responses are returned correctly during Mock mode
5. **Performance Improvements**: Measure and verify the speedup from caching

### What We DO NOT Test

These tests do not verify general application features:
- Pokemon card rendering (application UI concern)
- Form validations (application logic concern)
- Styling or animations (cosmetic concern)
- React component lifecycle (framework concern)

## Test Structure

This example uses the **shared test suite pattern** to ensure consistent testing across all magic-mock examples:

```typescript
import { createMagicMockTestSuite } from '../helpers/shared-test-suite'

createMagicMockTestSuite('webpack-react')
```

This single line creates a complete test suite with all necessary scenarios. The shared suite includes:

### Test Suites

1. **Magic Mock - Mode Testing**
   - `should have Magic Mock initialized and HUD visible`
   - `should allow switching between Magic Mock modes`

2. **Magic Mock - Recording Mode**
   - `should make real API calls in Record mode`
   - `should cache responses in Record mode`

3. **Magic Mock - Mocking Mode**
   - `should serve cached responses in Mock mode after recording`

4. **Magic Mock - Performance Comparison**
   - `should demonstrate performance improvement from Record to Mock mode`
   - `should show consistent times in Mock mode across multiple fetches`

5. **Magic Mock - Off Mode**
   - `should make real API calls in Off mode (no recording)`
   - `should not cache responses in Off mode`

## Running the Tests

### Prerequisites

1. Install dependencies from the monorepo root:
   ```bash
   pnpm install
   ```

2. Ensure Playwright browsers are installed:
   ```bash
   npx playwright install
   ```

### Run All Tests for webpack-react

Run only the webpack-react tests:
```bash
npx playwright test --project=webpack-react
```

### Run All Example Tests

Run tests for all examples (vite-vue, cli-vue, webpack-react, simple-axios, simple-jquery):
```bash
npx playwright test
```

### Run Specific Test Suite

Run only a specific test suite:
```bash
npx playwright test --project=webpack-react --grep "Performance Comparison"
```

### Run in UI Mode (Recommended for Development)

Playwright UI mode provides a great debugging experience:
```bash
npx playwright test --project=webpack-react --ui
```

### Run in Debug Mode

Step through tests with the Playwright Inspector:
```bash
npx playwright test --project=webpack-react --debug
```

### Run in Headed Mode

Watch tests execute in a real browser:
```bash
npx playwright test --project=webpack-react --headed
```

## Test Configuration

The webpack-react project is configured in `playwright.config.ts`:

```typescript
{
  name: 'webpack-react',
  testDir: './e2e/webpack-react',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:8081',
  },
}
```

### Web Server Configuration

Playwright automatically starts the webpack dev server before running tests:

```typescript
{
  command: 'cd examples/webpack-react && pnpm dev',
  port: 8081,
  reuseExistingServer: !process.env.CI,
  timeout: 120000, // Webpack can take longer to start
}
```

## Test Helpers

The tests leverage shared helpers from `e2e/helpers/`:

### Magic Mock Helpers (`magic-mock-helpers.ts`)

- `isMagicMockInitialized()` - Check if Magic Mock HUD is present
- `setMagicMockMode()` - Switch between Record/Mock/Off modes
- `getMagicMockMode()` - Get current mode from localStorage
- `clearMagicMockCache()` - Clear cache and reset state
- `setupNetworkInterceptor()` - Track network requests

### Pokemon Helpers (`pokemon-helpers.ts`)

- `waitForPageReady()` - Wait for page load and Magic Mock initialization
- `selectPokemonCount()` - Select Pokemon count from dropdown
- `fetchPokemon()` - Click fetch button and wait for results
- `verifyPokemonCards()` - Verify Pokemon cards are displayed
- `extractTiming()` - Extract performance metrics from UI
- `POKEMON_COUNTS` - Predefined count constants (SMALL=5, MEDIUM=10, LARGE=25)

## Expected Performance

The webpack-react example uses **sequential fetching** (one Pokemon at a time) to demonstrate the performance benefits of caching:

### Recording Mode (Real API Calls)
- 5 Pokemon: ~90ms (18ms per Pokemon)
- 10 Pokemon: ~180ms (18ms per Pokemon)
- 25 Pokemon: ~450ms (18ms per Pokemon)

### Mocking Mode (Cached Responses)
- 5 Pokemon: ~10-25ms (2-5ms per Pokemon)
- 10 Pokemon: ~20-50ms (2-5ms per Pokemon)
- 25 Pokemon: ~50-125ms (2-5ms per Pokemon)

### Expected Speedup
- **Minimum**: 2x faster (conservative for CI environments)
- **Typical**: 3-10x faster (realistic on good networks)
- **Maximum**: Can be 20x+ faster on slower networks

## CI/CD Integration

The tests are configured for CI environments:

- **Retries**: 2 retries on CI, 0 locally
- **Workers**: 1 worker on CI (sequential), unlimited locally (parallel)
- **Server reuse**: Disabled on CI, enabled locally
- **Artifacts**: Screenshots, videos, and traces captured on failure

## Troubleshooting

### Tests Fail to Start

1. Ensure the dev server can start manually:
   ```bash
   cd examples/webpack-react
   pnpm dev
   ```

2. Check port 8081 is not already in use:
   ```bash
   netstat -ano | findstr :8081
   ```

### Magic Mock HUD Not Found

1. Check that the unplugin is correctly configured in `webpack.config.js`
2. Verify the client script is injected (check browser DevTools)
3. Ensure middleware setup is correct in webpack dev server

### Tests are Flaky

The shared test suite uses Playwright's auto-waiting and polling to avoid flakiness:
- No fixed `setTimeout` calls
- Polling for localStorage state changes
- Auto-retry for element visibility
- Generous timeouts for network operations

If tests are still flaky:
1. Increase timeouts in `fetchPokemon()` helper
2. Check network stability
3. Verify cache directory permissions

### Performance Tests Fail

Performance tests can be sensitive to:
- Network conditions (use smaller Pokemon counts in CI)
- System load (ensure CI has adequate resources)
- Browser overhead (Chromium may be slower in headless mode)

The tests use conservative thresholds:
- Minimum 2x speedup (realistic for any environment)
- Variance < 5000ms (allows for CI fluctuations)

## Related Documentation

- [Shared Test Suite](../helpers/shared-test-suite.ts) - Common test logic
- [Magic Mock Helpers](../helpers/magic-mock-helpers.ts) - Mode switching utilities
- [Pokemon Helpers](../helpers/pokemon-helpers.ts) - Application-specific utilities
- [Playwright Config](../../playwright.config.ts) - Global test configuration
- [webpack-react README](../../examples/webpack-react/README.md) - Application documentation
