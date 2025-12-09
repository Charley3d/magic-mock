# E2E Tests Quick Start

## Prerequisites

```bash
# From monorepo root
pnpm install
pnpm build
```

## Running Tests

### Run all tests (all 4 examples)
```bash
pnpm test:e2e
```

### Run specific example
```bash
pnpm test:e2e:simple-axios    # Axios + standalone HTML
pnpm test:e2e:simple-jquery   # jQuery + standalone HTML
pnpm test:e2e:cli-vue         # Vue CLI + Webpack
pnpm test:e2e:vite-vue        # Vite + Vue 3 + TypeScript
```

### Interactive modes

```bash
pnpm test:e2e:ui        # Open Playwright UI (best for development)
pnpm test:e2e:headed    # Run with visible browser
pnpm test:e2e:debug     # Step through tests with Playwright Inspector
```

### View results
```bash
pnpm test:e2e:report    # Open HTML report after test run
```

## What Gets Tested

- Initial page state and UI elements
- Dropdown selection (1, 5, 10, 25, 50 Pokemon)
- Fetch button functionality
- Pokemon cards (image, name, types, height, weight)
- Stats display (count, timing)
- Loading states (button/dropdown disabled)
- Type badge colors
- Image loading
- Grid layout
- Magic Mock modes (Record/Mock/Off) - vite-vue only

## Test Count

- simple-axios: 18 tests
- simple-jquery: 18 tests
- cli-vue: 20 tests
- vite-vue: 33 tests (22 core + 11 Magic Mock mode tests)
- **Total: 89 tests**

## Typical Test Run Time

- All tests: ~2-4 minutes (parallel execution)
- Single example: ~30-60 seconds

## Common Issues

### Port already in use
Kill existing dev servers:
```bash
lsof -ti:3001 | xargs kill  # simple-axios
lsof -ti:3002 | xargs kill  # simple-jquery
lsof -ti:8080 | xargs kill  # cli-vue
lsof -ti:5173 | xargs kill  # vite-vue
```

### Tests timing out
Servers may take longer to start. The config allows up to 120s for cli-vue.

### Browsers not installed
```bash
npx playwright install
```

## File Structure

```
e2e/
├── helpers/               # Shared utilities
├── simple-axios/         # Tests for Axios example
├── simple-jquery/        # Tests for jQuery example
├── cli-vue/              # Tests for Vue CLI example
└── vite-vue/             # Tests for Vite+Vue + Magic Mock tests
```

## Need Help?

See full documentation: `/Users/ccodin/magicmock/magic-mock/e2e/README.md`
