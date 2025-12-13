# Quick Start Guide - webpack-react E2E Tests

This guide gets you running the webpack-react E2E tests in under 5 minutes.

## Prerequisites

```bash
# 1. Install dependencies (from monorepo root)
pnpm install

# 2. Install Playwright browsers (if not already installed)
npx playwright install chromium
```

## Running Tests

### Option 1: Run All webpack-react Tests (Recommended)

```bash
npx playwright test --project=webpack-react
```

**Expected Output:**
```
Running 9 tests using 1 worker

  ✓ Magic Mock - Mode Testing (webpack-react) > should have Magic Mock initialized and HUD visible
  ✓ Magic Mock - Mode Testing (webpack-react) > should allow switching between Magic Mock modes
  ✓ Magic Mock - Recording Mode (webpack-react) > should make real API calls in Record mode
  ✓ Magic Mock - Recording Mode (webpack-react) > should cache responses in Record mode
  ✓ Magic Mock - Mocking Mode (webpack-react) > should serve cached responses in Mock mode after recording
  ✓ Magic Mock - Performance Comparison (webpack-react) > should demonstrate performance improvement from Record to Mock mode
  ✓ Magic Mock - Performance Comparison (webpack-react) > should show consistent times in Mock mode across multiple fetches
  ✓ Magic Mock - Off Mode (webpack-react) > should make real API calls in Off mode (no recording)
  ✓ Magic Mock - Off Mode (webpack-react) > should not cache responses in Off mode

  9 passed (45s)
```

### Option 2: Run with UI Mode (Great for Debugging)

```bash
npx playwright test --project=webpack-react --ui
```

This opens an interactive UI where you can:
- See tests running in real-time
- Step through test execution
- View DOM snapshots
- Inspect network requests
- Replay failed tests

### Option 3: Run in Headed Mode (Watch Browser)

```bash
npx playwright test --project=webpack-react --headed
```

This runs tests in a visible browser window so you can watch the interactions.

### Option 4: Run Specific Test Suite

```bash
# Run only performance tests
npx playwright test --project=webpack-react --grep "Performance Comparison"

# Run only mode switching tests
npx playwright test --project=webpack-react --grep "Mode Testing"

# Run only mocking tests
npx playwright test --project=webpack-react --grep "Mocking Mode"
```

### Option 5: Debug a Single Test

```bash
npx playwright test --project=webpack-react --grep "should demonstrate performance improvement" --debug
```

This opens the Playwright Inspector where you can step through the test line by line.

## Understanding Test Output

### Successful Test Run

```
✓ Magic Mock - Mocking Mode (webpack-react) > should serve cached responses in Mock mode after recording (5.2s)
```

- ✓ = Test passed
- (5.2s) = Test duration
- All assertions passed

### Failed Test Run

```
✗ Magic Mock - Mocking Mode (webpack-react) > should serve cached responses in Mock mode after recording (10.5s)

  Error: expect(received).toBe(expected)

  Expected: 0
  Received: 5

  at magic-mock-modes.spec.ts:152:5
```

- ✗ = Test failed
- Shows which assertion failed
- Shows expected vs actual values
- Shows line number for debugging

### Console Logs

Tests include helpful console output for performance measurements:

```
[webpack-react] Record mode time: 186ms (sequential fetching: 10 Pokemon)
[webpack-react] Mock mode time: 42ms
[webpack-react] Speedup factor: 4.4x faster
```

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens a detailed report showing:
- Test results with screenshots
- Failed test traces
- Performance timings
- Network activity

## Common Issues and Solutions

### Issue 1: Port 8081 Already in Use

**Error:**
```
Error: Port 8081 is already in use
```

**Solution:**
```bash
# Find and kill the process using port 8081
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Or use a different terminal to stop the dev server
cd examples/webpack-react
# Press Ctrl+C if server is running
```

### Issue 2: Webpack Server Timeout

**Error:**
```
Error: Timed out waiting for http://localhost:8081 to be ready
```

**Solution:**
```bash
# Manually verify the server can start
cd examples/webpack-react
pnpm dev

# If it starts, kill it and re-run tests
# If it fails, check for build errors or missing dependencies
```

### Issue 3: Magic Mock Not Initialized

**Error:**
```
Error: expect(received).toBe(expected)
Expected: true
Received: false
```

**Solution:**
This means the Magic Mock HUD buttons aren't appearing. Check:
1. Verify `webpack.config.js` has the MagicMock plugin configured
2. Check browser console for client script errors
3. Ensure middleware is set up correctly in devServer config

### Issue 4: Performance Tests Failing

**Error:**
```
Error: expect(received).toBeGreaterThan(expected)
Expected: > 2
Received: 1.8
```

**Solution:**
This means mock mode isn't providing expected speedup. Common causes:
1. Network is very fast (making caching less impactful)
2. CI environment has high variance
3. Cache isn't being used (check Record mode ran first)

Adjust threshold if this is consistently failing on good hardware:
```typescript
// In shared-test-suite.ts, line ~205
expect(speedupFactor).toBeGreaterThan(1.5) // Lower threshold
```

### Issue 5: Tests are Flaky

**Symptoms:** Tests pass sometimes, fail other times

**Solution:**
1. Run with retries (already configured for CI):
   ```bash
   npx playwright test --project=webpack-react --retries=2
   ```

2. Check for timing issues (should be rare due to auto-waiting)

3. Verify network stability

## Test Development Workflow

### Step 1: Run Tests in UI Mode

```bash
npx playwright test --project=webpack-react --ui
```

### Step 2: Select a Test and Watch It Run

Click on a test in the sidebar to see:
- DOM state at each step
- Console logs
- Network requests
- Timing information

### Step 3: Make Changes to Tests

Edit `magic-mock-modes.spec.ts` or helper files. Tests auto-reload in UI mode.

### Step 4: Debug Failures

If a test fails:
1. Click on the failed test
2. View the error message
3. Click through the timeline to see what went wrong
4. Use "Pick locator" to verify selectors
5. Check the network tab for API calls

## Performance Benchmarks

Expected timing (from real test runs):

### Record Mode (10 Pokemon)
- **Minimum**: 150ms
- **Typical**: 180ms
- **Maximum**: 250ms (slower network)
- **Per Pokemon**: ~18ms average

### Mock Mode (10 Pokemon)
- **Minimum**: 20ms
- **Typical**: 40ms
- **Maximum**: 80ms (CI overhead)
- **Per Pokemon**: ~4ms average

### Speedup Factor
- **Minimum**: 2x (conservative threshold)
- **Typical**: 3-5x (good network)
- **Maximum**: 10x+ (slow network)

## Next Steps

After running tests successfully:

1. **Read TEST_COVERAGE.md** - Understand what each test does
2. **Read README.md** - Learn about the test architecture
3. **Explore helpers/** - See shared utilities used by all examples
4. **Try other examples** - Run tests for vite-vue, cli-vue, etc.

## Quick Reference

```bash
# Run all webpack-react tests
npx playwright test --project=webpack-react

# Run with UI (best for development)
npx playwright test --project=webpack-react --ui

# Run in headed mode (watch browser)
npx playwright test --project=webpack-react --headed

# Debug specific test
npx playwright test --project=webpack-react --grep "performance" --debug

# Run all examples
npx playwright test

# View report
npx playwright show-report

# List all tests
npx playwright test --project=webpack-react --list
```

## Getting Help

- **Playwright Docs**: https://playwright.dev/
- **Project README**: `examples/webpack-react/README.md`
- **Test Helpers**: `e2e/helpers/` directory
- **Issues**: Check browser console and Playwright traces
