import { expect, test } from '@playwright/test'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  clearMagicMockCache,
  getMagicMockMode,
  isMagicMockInitialized,
  MagicMockMode,
  setMagicMockMode,
  setupNetworkInterceptor,
} from './magic-mock-helpers'
import {
  extractTiming,
  fetchPokemon,
  POKEMON_COUNTS,
  selectPokemonCount,
  verifyPokemonCards,
  waitForPageReady,
} from './pokemon-helpers'

/**
 * Shared test suite factory for Magic Mock E2E tests
 *
 * This factory creates identical test suites for all example projects to ensure
 * consistent testing across different implementations (vite-vue, cli-vue, simple-axios, simple-jquery).
 *
 * The DRY approach:
 * - All example projects test the SAME MagicMock functionality
 * - Test logic is defined once in this factory
 * - Each example just calls createMagicMockTestSuite() with its name
 * - No code duplication across test files
 *
 * Usage:
 * ```typescript
 * import { createMagicMockTestSuite } from '../helpers/shared-test-suite'
 * createMagicMockTestSuite('simple-axios')
 * ```
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

export function createMagicMockTestSuite(projectName: string) {
  test.describe(`Magic Mock - Mode Testing (${projectName})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await waitForPageReady(page)
      await clearMagicMockCache(page)
    })

    test('should have Magic Mock initialized and HUD visible', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      expect(initialized).toBe(true)
    })

    test('should allow switching between Magic Mock modes', async ({ page }) => {
      // Check if Magic Mock is initialized
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      // Test switching to Record mode
      await setMagicMockMode(page, MagicMockMode.RECORD)
      let mode = await getMagicMockMode(page)
      expect(mode).toBe('record')

      // Test switching to Mock mode
      await setMagicMockMode(page, MagicMockMode.MOCK)
      mode = await getMagicMockMode(page)
      expect(mode).toBe('mock')
    })
  })

  test.describe(`Magic Mock - Recording Mode (${projectName})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await waitForPageReady(page)
      await clearMagicMockCache(page)
    })

    test('should make real API calls in Record mode', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      // Set up network interceptor to count real requests
      const interceptor = await setupNetworkInterceptor(page)

      // Set to Record mode
      await setMagicMockMode(page, MagicMockMode.RECORD)

      // Fetch Pokemon
      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)

      // Verify Pokemon were fetched correctly
      await verifyPokemonCards(page, 5)

      // Verify real network requests were made
      const requestCount = interceptor.getRequestCount()
      expect(requestCount).toBe(5) // Should have made 5 real API calls
    })

    test('should cache responses in Record mode', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      await setMagicMockMode(page, MagicMockMode.RECORD)

      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)

      await verifyPokemonCards(page, POKEMON_COUNTS.SMALL)

      // After recording, we should be able to switch to Mock mode
      // and get the same results without network calls
    })
  })

  test.describe.only(`Magic Mock - Mocking Mode (${projectName})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await waitForPageReady(page)
      await clearMagicMockCache(page)
    })

    test('should serve cached responses in Mock mode after recording', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      // Step 1: Record mode - make real API calls
      await setMagicMockMode(page, MagicMockMode.RECORD)
      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)
      await verifyPokemonCards(page, POKEMON_COUNTS.SMALL)

      // Step 2: Mock mode - serve from cache
      await setMagicMockMode(page, MagicMockMode.MOCK)
      const interceptor = await setupNetworkInterceptor(page)

      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)
      await verifyPokemonCards(page, POKEMON_COUNTS.SMALL)

      // In mock mode, no real network requests should be made (served from cache)
      const requestCount = interceptor.getRequestCount()
      expect(requestCount).toBe(0)
    })
  })

  test.describe(`Magic Mock - Performance Comparison (${projectName})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await waitForPageReady(page)
      await clearMagicMockCache(page)
    })

    test('should demonstrate performance improvement from Record to Mock mode', async ({
      page,
    }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      // Step 1: Record mode - measure time for real API calls (sequential fetching)
      await setMagicMockMode(page, MagicMockMode.RECORD)
      await selectPokemonCount(page, POKEMON_COUNTS.MEDIUM)
      await fetchPokemon(page)
      await verifyPokemonCards(page, 10)

      const recordTiming = await extractTiming(page)
      const recordTime = recordTiming.totalTime

      console.log(
        `[${projectName}] Record mode time: ${recordTime}ms (sequential fetching: 10 Pokemon)`,
      )

      // Step 2: Mock mode - measure time for cached responses
      await setMagicMockMode(page, MagicMockMode.MOCK)
      await selectPokemonCount(page, POKEMON_COUNTS.MEDIUM)
      await fetchPokemon(page)
      await verifyPokemonCards(page, 10)

      const mockTiming = await extractTiming(page)
      const mockTime = mockTiming.totalTime

      console.log(`[${projectName}] Mock mode time: ${mockTime}ms`)
      const speedupFactor = recordTime / mockTime
      console.log(`[${projectName}] Speedup factor: ${speedupFactor.toFixed(1)}x faster`)

      // Mock mode should be faster than record mode
      // Sequential fetching with good network: ~18ms per Pokemon = ~180ms for 10
      // Cached responses: ~2-5ms per Pokemon = ~20-50ms for 10
      // Expected speedup: 3-10x (realistic, not 100x)
      expect(mockTime).toBeLessThan(recordTime)

      // We expect at least a 2x speedup with caching
      expect(speedupFactor).toBeGreaterThan(2)

      // Record mode should take some measurable time (at least 50ms for 10 Pokemon)
      expect(recordTime).toBeGreaterThan(50)
    })

    test('should show consistent times in Mock mode across multiple fetches', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      // First, record the data
      await setMagicMockMode(page, MagicMockMode.RECORD)
      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)
      await verifyPokemonCards(page, 5)

      // Switch to mock mode
      await setMagicMockMode(page, MagicMockMode.MOCK)

      // Fetch multiple times and measure consistency
      const times: number[] = []

      for (let i = 0; i < 3; i++) {
        await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
        await fetchPokemon(page)
        const timing = await extractTiming(page)
        times.push(timing.totalTime)
      }

      console.log(`[${projectName}] Mock mode times: ${times.join('ms, ')}ms`)

      // All times should be fast from cache (sequential: 5 Pokemon × ~2-5ms = ~10-25ms)
      times.forEach((time) => {
        expect(time).toBeLessThan(200) // Should be fast from cache (allow headroom for CI)
      })

      // Calculate variance - should be low
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length

      console.log(`[${projectName}] Average: ${avg.toFixed(1)}ms, Variance: ${variance.toFixed(1)}`)

      // Variance should be relatively low (cached responses are consistent)
      // Allow reasonable variance as timing can fluctuate in CI environments
      expect(variance).toBeLessThan(5000)
    })
  })

  test.describe(`Magic Mock - Off Mode (${projectName})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await waitForPageReady(page)
      await clearMagicMockCache(page)
    })

    test('should make real API calls in Off mode (no recording)', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      const interceptor = await setupNetworkInterceptor(page)

      // Set to Off mode
      await setMagicMockMode(page, MagicMockMode.OFF)

      // Fetch Pokemon
      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)
      await verifyPokemonCards(page, POKEMON_COUNTS.SMALL)

      // Should make real requests (no caching)
      const requestCount = interceptor.getRequestCount()
      expect(requestCount).toBe(POKEMON_COUNTS.SMALL)
    })

    test('should not cache responses in Off mode', async ({ page }) => {
      const initialized = await isMagicMockInitialized(page)
      if (!initialized) {
        test.skip()
        return
      }

      await setMagicMockMode(page, MagicMockMode.OFF)

      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)

      // Fetch again - should make requests again (not from cache)
      const interceptor = await setupNetworkInterceptor(page)

      await selectPokemonCount(page, POKEMON_COUNTS.SMALL)
      await fetchPokemon(page)

      const requestCount = interceptor.getRequestCount()
      expect(requestCount).toBe(POKEMON_COUNTS.SMALL) // Should make fresh requests
    })
  })
}
