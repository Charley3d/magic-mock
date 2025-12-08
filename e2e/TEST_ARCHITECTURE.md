# E2E Test Architecture

## Overview

This document describes the architecture and design patterns used in the Magic Mock E2E test suite.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Playwright Test Runner                       │
│                    (playwright.config.ts)                         │
└────────┬─────────────┬─────────────┬─────────────┬──────────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
    │Project │   │ Project │   │ Project │   │ Project │
    │ Axios  │   │ jQuery  │   │ CLI-Vue │   │Vite-Vue │
    └────┬───┘   └────┬────┘   └────┬────┘   └────┬────┘
         │            │             │             │
         ▼            ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
    │http-srv│   │http-srv │   │Webpack  │   │  Vite   │
    │ :3001  │   │ :3002   │   │Dev :8080│   │Dev :5173│
    └────────┘   └─────────┘   └─────────┘   └─────────┘
```

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Specs                              │
│  pokemon-explorer.spec.ts (4 files)                          │
│  magic-mock-modes.spec.ts (1 file)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │ imports
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Shared Test Helpers                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐     │
│  │ pokemon-helpers.ts  │  │ magic-mock-helpers.ts    │     │
│  │                     │  │                          │     │
│  │ - waitForPageReady  │  │ - setMagicMockMode       │     │
│  │ - verifyInitial     │  │ - clearMagicMockCache    │     │
│  │ - selectCount       │  │ - setupInterceptor       │     │
│  │ - fetchPokemon      │  │ - verifyRequestsMocked   │     │
│  │ - verifyCards       │  │                          │     │
│  │ - verifyStats       │  │                          │     │
│  │ - 11+ more...       │  │                          │     │
│  └─────────────────────┘  └──────────────────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │ uses
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                Playwright Test API                           │
│  @playwright/test                                            │
│  - page, expect, test, describe                              │
│  - locator, click, waitFor, etc.                             │
└─────────────────────────────────────────────────────────────┘
```

## Test Flow Pattern

All tests follow the Arrange-Act-Assert (AAA) pattern:

```typescript
test('should fetch 5 Pokemon', async ({ page }) => {
  // ARRANGE: Set up the test
  await page.goto('/')
  await waitForPageReady(page)
  await selectPokemonCount(page, POKEMON_COUNTS.SMALL)

  // ACT: Perform the action
  await fetchPokemon(page)

  // ASSERT: Verify the outcome
  await verifyPokemonCards(page, 5)
  await verifyStats(page, 5)
  await verifyPokemonNames(page, 5)
})
```

## Helper Function Design

### Pokemon Helpers

**Purpose**: Encapsulate common Pokemon Explorer test operations

**Key Principles**:

- Each helper does one thing well
- Helpers are composable
- Assertions use Playwright's auto-waiting
- Selectors are centralized in `SELECTORS` constant

**Categories**:

1. **Page State Helpers**
   - `waitForPageReady()` - Wait for page load
   - `verifyInitialPageState()` - Check initial UI

2. **Interaction Helpers**
   - `selectPokemonCount()` - Change dropdown
   - `fetchPokemon()` - Click button and wait

3. **Verification Helpers**
   - `verifyPokemonCards()` - Check cards rendered
   - `verifyStats()` - Validate stats display
   - `verifyPokemonNames()` - Check correct order
   - `verifyTypeBadges()` - Validate badge colors
   - `verifyImagesLoaded()` - Ensure images loaded

4. **Data Extraction Helpers**
   - `extractTiming()` - Get performance data

5. **Composite Helpers**
   - `testPokemonCount()` - Full test flow for a count

### Magic Mock Helpers

**Purpose**: Test Magic Mock recording/mocking functionality

**Key Principles**:

- Test mode switching
- Verify cache behavior
- Measure performance differences
- Handle feature detection (HUD may not exist)

**Categories**:

1. **Mode Management**
   - `setMagicMockMode()` - Switch modes
   - `getMagicMockMode()` - Read current mode

2. **Cache Management**
   - `clearMagicMockCache()` - Reset for clean tests

3. **Verification**
   - `isMagicMockInitialized()` - Check HUD present
   - `verifyRequestsAreMocked()` - Confirm caching
   - `setupNetworkInterceptor()` - Track real requests

## Selector Strategy

### Centralized Selectors

All selectors are defined in `SELECTORS` constant:

```typescript
export const SELECTORS = {
  pokemonCountDropdown: '#pokemonCount',
  fetchButton: 'button:has-text("Fetch Pokemon")',
  resultContainer: '.result, #result', // Multiple selectors
  pokemonCard: '.pokemon-card',
  // ...
}
```

**Benefits**:

- Single source of truth
- Easy to update if UI changes
- Support multiple selector patterns (Vue vs HTML)

### Selector Priority

1. **ID selectors** (`#pokemonCount`) - Most specific
2. **Text-based selectors** (`button:has-text("Fetch")`) - User-facing
3. **Class selectors** (`.pokemon-card`) - Stable across frameworks
4. **Combined selectors** (`.result, #result`) - Handle variations

## Project Configuration

Each example has dedicated configuration:

```typescript
{
  name: 'simple-axios',
  testDir: './e2e/simple-axios',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'cd examples/simple-axios && npx http-server -p 3001',
    port: 3001,
    reuseExistingServer: !process.env.CI,
  },
}
```

**Key Features**:

- Isolated test directories
- Automatic server startup/shutdown
- Server reuse in dev (faster iteration)
- Fresh servers on CI (reliability)

## Test Isolation

### Before Each Hook

Tests use `beforeEach` to ensure clean state:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForPageReady(page)
  // Optional: Clear cache for Magic Mock tests
  await clearMagicMockCache(page)
})
```

**Benefits**:

- Each test starts fresh
- No test interdependencies
- Parallel execution safe

### Test Independence

- Tests don't rely on execution order
- Each test can run in isolation
- State is reset between tests

## Performance Testing Pattern

Magic Mock performance tests follow this pattern:

```typescript
// 1. Record mode - measure real API time
await setMagicMockMode(page, MagicMockMode.RECORD)
await fetchPokemon(page)
const recordTime = await extractTiming(page)

// 2. Mock mode - measure cached response time
await setMagicMockMode(page, MagicMockMode.MOCK)
await fetchPokemon(page)
const mockTime = await extractTiming(page)

// 3. Compare
const speedup = recordTime.totalTime / mockTime.totalTime
expect(speedup).toBeGreaterThan(2) // At least 2x faster
```

## Error Handling Strategy

### Graceful Degradation

Tests handle missing features gracefully:

```typescript
const initialized = await isMagicMockInitialized(page)
if (!initialized) {
  test.skip() // Skip if Magic Mock not available
  return
}
```

### Retry Logic

- CI: 2 automatic retries for flaky tests
- Local: No retries (immediate feedback)

### Failure Artifacts

On failure, automatically capture:

- Screenshot
- Video recording
- Trace file (step-by-step execution)

## Parallel Execution

```
┌─────────────────────────────────────────┐
│        Playwright Test Runner            │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
    Worker 1   Worker 2   Worker 3   Worker 4
       │          │          │          │
   ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
   │ Axios │  │jQuery │  │CLI-Vue│  │Vite-Vu│
   │ Tests │  │ Tests │  │ Tests │  │ Tests │
   └───────┘  └───────┘  └───────┘  └───────┘
```

**Configuration**:

- Local: Parallel workers (default: CPU count)
- CI: Serial execution (workers: 1)
- Reason: CI environments may have resource constraints

## Test Data Strategy

### Hardcoded Expected Data

Tests use hardcoded Pokemon names that match the application:

```typescript
export const EXPECTED_POKEMON = [
  'pikachu',
  'charizard',
  'bulbasaur',
  // ...
]
```

**Benefits**:

- Deterministic test results
- No external data dependencies
- Tests validate real API integration

### Data-Driven Tests

Use loops for testing multiple counts:

```typescript
const counts = [1, 5, 10, 25, 50]
for (const count of counts) {
  await selectPokemonCount(page, count)
  // Test with this count
}
```

## Extensibility Points

### Adding New Examples

1. Create test directory: `e2e/new-example/`
2. Add project to `playwright.config.ts`
3. Import and use shared helpers
4. Add npm script

### Adding New Helpers

1. Add function to appropriate helper file
2. Export it
3. Import in test files
4. Document in helper file comments

### Adding New Test Categories

1. Create new `describe` block
2. Use existing helpers
3. Follow AAA pattern
4. Add clear test names

## Best Practices Applied

1. **DRY (Don't Repeat Yourself)**: Shared helpers eliminate duplication
2. **Single Responsibility**: Each helper has one clear purpose
3. **Composition**: Helpers can be combined for complex scenarios
4. **Auto-waiting**: Use Playwright's built-in waiting, not fixed timeouts
5. **Clear Naming**: Test names describe the scenario
6. **Test Isolation**: Each test is independent
7. **Failure Diagnostics**: Rich artifacts for debugging
8. **CI-Ready**: Configuration optimized for automated testing

## Maintenance Strategy

### When UI Changes

1. Update `SELECTORS` in `pokemon-helpers.ts`
2. All tests automatically use new selectors
3. No need to update individual tests

### When Adding Features

1. Add new helper functions for new interactions
2. Write tests using those helpers
3. Maintain backward compatibility

### When Debugging Failures

1. Run in UI mode: `pnpm test:e2e:ui`
2. Check trace viewer for step-by-step execution
3. Review screenshots and videos
4. Use debug mode if needed

## Summary

The test architecture is designed for:

- **Maintainability**: Clear structure, shared utilities
- **Reliability**: Best practices, auto-waiting, retries
- **Extensibility**: Easy to add new tests/examples
- **Efficiency**: Parallel execution, server reuse
- **Debuggability**: Rich failure artifacts, multiple debug modes

This architecture ensures the test suite remains valuable and maintainable as the project grows.
