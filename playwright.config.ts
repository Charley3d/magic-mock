import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Magic Mock E2E tests
 * Tests are organized per example project with different server configurations
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/results.json' }]],

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // This will be overridden by webServer configs
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for different examples
  projects: [
    {
      name: 'simple-axios',
      testDir: './e2e/simple-axios',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      // Use webServer to start a simple HTTP server for standalone examples
      // webServer: {
      //   command: 'cd examples/simple-axios && npx http-server -p 3001 --silent',
      //   port: 3001,
      //   reuseExistingServer: !process.env.CI,
      // },
    },

    {
      name: 'simple-jquery',
      testDir: './e2e/simple-jquery',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
      // webServer: {
      //   command: 'cd examples/simple-jquery && npx http-server -p 3002 --silent',
      //   port: 3002,
      //   reuseExistingServer: !process.env.CI,
      // },
    },

    {
      name: 'cli-vue',
      testDir: './e2e/cli-vue',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8080',
      },
      webServer: {
        // command: 'cd examples/cli-vue && pnpm serve',
        // port: 8080,
        // reuseExistingServer: !process.env.CI,
        // timeout: 120000, // Vue CLI can take longer to start
      },
    },

    {
      name: 'vite-vue',
      testDir: './e2e/vite-vue',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
      // webServer: {
      //   command: 'cd examples/vite-vue && pnpm dev',
      //   port: 5173,
      //   reuseExistingServer: !process.env.CI,
      // },
    },
  ],
  webServer: [
    {
      command: 'cd examples/vite-vue && pnpm dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd examples/cli-vue && pnpm serve',
      port: 8080,
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // Vue CLI can take longer to start
    },
    {
      command: 'cd examples/simple-jquery && npx http-server -p 3002 --silent',
      port: 3002,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd examples/simple-axios && npx http-server -p 3001 --silent',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
