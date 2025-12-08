import { Locator, Page, expect } from '@playwright/test'

/**
 * Shared test utilities for Pokemon Explorer E2E tests
 * These helpers work across all example implementations (simple-axios, simple-jquery, cli-vue, vite-vue)
 */

/**
 * Common selectors used across all Pokemon Explorer implementations
 */
export const SELECTORS = {
  // Controls
  pokemonCountDropdown: '#pokemonCount',
  fetchButton: 'button:has-text("Fetch Pokemon")',
  fetchingButton: 'button:has-text("Fetching...")',

  // Results container
  resultContainer: '.result, #result',

  // Stats
  statsContainer: '.stats',
  countStat: '.stats span:first-child, #count',
  timeStat: '.stats span:last-child, #rtt',

  // Pokemon grid and cards
  pokemonGrid: '.pokemon-grid, #pokemonList',
  pokemonCard: '.pokemon-card',
  pokemonImage: '.pokemon-card img',
  pokemonName: '.pokemon-name',
  typeBadge: '.type-badge',

  // Error
  errorContainer: '.error',
} as const

/**
 * Valid Pokemon count options available in the dropdown
 * IMPORTANT: Tests should use a maximum of 25 Pokemon to avoid spamming the PokeAPI server
 */
export const POKEMON_COUNTS = {
  MIN: 1,
  SMALL: 5,
  MEDIUM: 10,
  LARGE: 25,
  MAX: 50, // Only use in exceptional cases to avoid API spam
} as const

/**
 * Expected Pokemon data based on the hardcoded POKEMON_NAMES array
 * These are the first N Pokemon that should be fetched
 */
export const EXPECTED_POKEMON = [
  'pikachu',
  'charizard',
  'bulbasaur',
  'squirtle',
  'mewtwo',
  'eevee',
  'snorlax',
  'dragonite',
  'gengar',
  'gyarados',
] as const

/**
 * Helper to wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('h1')).toContainText('Magic Mock')
}

/**
 * Helper to verify initial page state before any interactions
 */
export async function verifyInitialPageState(page: Page) {
  // Page title should be visible
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('h1')).toContainText('Pokemon Explorer')

  // Description text should be visible
  await expect(page.locator('p')).toContainText('Select how many Pokemon to fetch')

  // Controls should be visible
  await expect(page.locator(SELECTORS.pokemonCountDropdown)).toBeVisible()
  await expect(page.locator(SELECTORS.fetchButton)).toBeVisible()

  // Fetch button should be enabled initially
  await expect(page.locator(SELECTORS.fetchButton)).toBeEnabled()

  // Result container should not be visible initially
  const resultContainer = page.locator(SELECTORS.resultContainer)
  const isVisible = await resultContainer.isVisible().catch(() => false)
  if (isVisible) {
    // If it exists, it should be hidden
    await expect(resultContainer).toHaveCSS('display', 'none')
  }
}

/**
 * Helper to select a Pokemon count from the dropdown
 */
export async function selectPokemonCount(page: Page, count: number) {
  await page.locator(SELECTORS.pokemonCountDropdown).selectOption(count.toString())
  const selectedValue = await page.locator(SELECTORS.pokemonCountDropdown).inputValue()
  expect(selectedValue).toBe(count.toString())
}

/**
 * Helper to click fetch button and wait for results
 *
 * Note: Sequential fetching times with for...of loop (actual observed performance):
 * - Recording mode with good network: ~18ms per Pokemon
 *   - 10 Pokemon: ~180ms
 *   - 25 Pokemon: ~450ms
 *   - 50 Pokemon: ~900ms
 * - Mocking mode (cached): ~2-5ms per Pokemon
 *   - 50 Pokemon: ~100-250ms
 * - Performance improvement: approximately 3-10x faster with caching
 *
 * Default timeout: 10 seconds (sufficient for 50 Pokemon even with slower networks)
 */
export async function fetchPokemon(page: Page, options?: { timeout?: number }) {
  const fetchButton = page.locator(SELECTORS.fetchButton)
  await fetchButton.click()

  // Wait for the results container to become visible
  // 10 second default timeout handles 50 Pokemon with network variability
  await expect(page.locator(SELECTORS.resultContainer)).toBeVisible({
    timeout: options?.timeout || 10000,
  })
}

/**
 * Helper to verify Pokemon cards are displayed correctly
 */
export async function verifyPokemonCards(page: Page, expectedCount: number) {
  const cards = page.locator(SELECTORS.pokemonCard)

  // Wait for all cards to be present
  await expect(cards).toHaveCount(expectedCount)

  // Verify each card has required elements
  for (let i = 0; i < expectedCount; i++) {
    const card = cards.nth(i)

    // Each card should have an image
    await expect(card.locator('img')).toBeVisible()
    const imgSrc = await card.locator('img').getAttribute('src')
    expect(imgSrc).toBeTruthy()
    expect(imgSrc).toContain('http') // Should be a valid URL

    // Each card should have a name
    const nameElement = card.locator(SELECTORS.pokemonName)
    await expect(nameElement).toBeVisible()
    const nameText = await nameElement.textContent()
    expect(nameText).toBeTruthy()
    expect(nameText!.length).toBeGreaterThan(0)

    // Each card should have at least one type badge
    const typeBadges = card.locator(SELECTORS.typeBadge)
    await expect(typeBadges.first()).toBeVisible()

    // Each card should have height and weight
    const cardText = await card.textContent()
    expect(cardText).toContain('Height')
    expect(cardText).toContain('Weight')
  }
}

/**
 * Helper to verify stats display
 */
export async function verifyStats(page: Page, expectedCount: number) {
  const statsContainer = page.locator(SELECTORS.statsContainer)
  await expect(statsContainer).toBeVisible()

  // Verify count is displayed correctly
  const statsText = await statsContainer.textContent()
  expect(statsText).toContain(`Pokemon Loaded: ${expectedCount}`)
  expect(statsText).toContain('Total Time:')
  expect(statsText).toContain('ms')
  expect(statsText).toMatch(/\d+ms/) // Should contain a number followed by 'ms'
}

/**
 * Helper to extract timing information from stats
 */
export async function extractTiming(page: Page): Promise<{ totalTime: number; avgTime: number }> {
  const statsText = await page.locator(SELECTORS.statsContainer).textContent()

  // Extract total time (e.g., "Total Time: 1234ms")
  const totalTimeMatch = statsText!.match(/Total Time:\s*(\d+)ms/)
  const totalTime = totalTimeMatch ? parseInt(totalTimeMatch[1], 10) : 0

  // Extract average time (e.g., "(123ms avg per Pokemon)")
  const avgTimeMatch = statsText!.match(/\((\d+)ms\s+avg/)
  const avgTime = avgTimeMatch ? parseInt(avgTimeMatch[1], 10) : 0

  return { totalTime, avgTime }
}

/**
 * Helper to verify that Pokemon names match expected values
 */
export async function verifyPokemonNames(page: Page, expectedCount: number) {
  const cards = page.locator(SELECTORS.pokemonCard)
  const expectedNames = EXPECTED_POKEMON.slice(0, expectedCount)

  for (let i = 0; i < expectedCount; i++) {
    const card = cards.nth(i)
    const nameElement = card.locator(SELECTORS.pokemonName)
    const actualName = (await nameElement.textContent())?.toLowerCase()

    // Verify the name matches what we expect based on POKEMON_NAMES array
    expect(actualName).toBe(expectedNames[i])
  }
}

/**
 * Helper to clear localStorage (useful for testing different Magic Mock modes)
 */
export async function clearMagicMockCache(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
  })
}

/**
 * Helper to verify type badges are colored correctly
 */
export async function verifyTypeBadges(page: Page) {
  const typeBadges = page.locator(SELECTORS.typeBadge)
  const count = await typeBadges.count()

  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const badge = typeBadges.nth(i)
    await expect(badge).toBeVisible()

    // Verify badge has background color (any color other than transparent)
    const bgColor = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor)

    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)') // Not transparent
    expect(bgColor).not.toBe('transparent')
  }
}

/**
 * Helper to verify Pokemon images are loaded
 */
export async function verifyImagesLoaded(page: Page, expectedCount: number) {
  const images = page.locator(SELECTORS.pokemonImage)

  for (let i = 0; i < expectedCount; i++) {
    const img = images.nth(i)

    // Wait for image to be visible
    await expect(img).toBeVisible()

    // Verify image has loaded by checking naturalWidth

    const isLoaded = await img.evaluate((imgEl) => {
      const image = imgEl as HTMLImageElement
      return image.complete && image.naturalWidth > 0
    })

    await expectImageToBeLoaded(img)
  }
}

export async function expectImageToBeLoaded(img: Locator, timeout = 300) {
  await expect(async () => {
    const loaded = await img.evaluate((imgEl) => {
      const img = imgEl as HTMLImageElement
      return img.complete && img.naturalWidth > 0
    })
    if (!loaded) throw new Error('Image not loaded yet')
  }).toPass({ timeout })
}

/**
 * Helper to test different Pokemon counts
 * This is a common test pattern across all examples
 */
export async function testPokemonCount(page: Page, count: number, testName?: string) {
  const description = testName || `fetch ${count} Pokemon`

  // Select the count
  await selectPokemonCount(page, count)

  // Fetch Pokemon
  await fetchPokemon(page)

  // Verify the results
  await verifyPokemonCards(page, count)
  await verifyStats(page, count)
  await verifyPokemonNames(page, count)

  return description
}
