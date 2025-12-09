import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for testing Magic Mock functionality
 * These helpers assist in testing the recording, mocking, and off modes
 */

/**
 * Magic Mock HUD button selectors
 * Note: These may not be visible if Magic Mock is not properly initialized
 * There are only 2 buttons (Record and Mock) - both are toggles
 */
export const MAGIC_MOCK_SELECTORS = {
  recordButton: 'button:has-text("Record")',
  mockButton: 'button:has-text("Mock")',
} as const;

/**
 * Magic Mock modes
 * Note: OFF mode is when both Record and Mock are disabled
 */
export enum MagicMockMode {
  RECORD = 'record',
  MOCK = 'mock',
  OFF = 'off',
}

/**
 * Helper to check if Magic Mock HUD is present on the page
 * This validates that Magic Mock has been properly initialized
 */
export async function isMagicMockInitialized(page: Page): Promise<boolean> {
  // Check if both Magic Mock buttons are present
  const recordButton = await page.locator(MAGIC_MOCK_SELECTORS.recordButton).count();
  const mockButton = await page.locator(MAGIC_MOCK_SELECTORS.mockButton).count();

  return recordButton > 0 && mockButton > 0;
}

/**
 * Helper to set Magic Mock mode
 * Handles toggle buttons - clicks buttons as needed to reach the desired state
 */
export async function setMagicMockMode(page: Page, mode: MagicMockMode) {
  // Get current state from localStorage
  const isCurrentlyRecording = await page.evaluate(() =>
    localStorage.getItem('magic-mock-recording') === 'true'
  );
  const isCurrentlyMocking = await page.evaluate(() =>
    localStorage.getItem('magic-mock-mocking') === 'true'
  );

  const recordButton = page.locator(MAGIC_MOCK_SELECTORS.recordButton);
  const mockButton = page.locator(MAGIC_MOCK_SELECTORS.mockButton);

  // Ensure buttons are visible
  await expect(recordButton).toBeVisible();
  await expect(mockButton).toBeVisible();

  switch (mode) {
    case MagicMockMode.RECORD:
      // Want: recording ON, mocking OFF
      if (!isCurrentlyRecording) {
        await recordButton.click();
        // Wait for localStorage to update instead of fixed timeout
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-recording'))
        ).toBe('true');
      }
      if (isCurrentlyMocking) {
        await mockButton.click();
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-mocking'))
        ).toBe('false');
      }
      break;

    case MagicMockMode.MOCK:
      // Want: mocking ON, recording OFF
      if (!isCurrentlyMocking) {
        await mockButton.click();
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-mocking'))
        ).toBe('true');
      }
      if (isCurrentlyRecording) {
        await recordButton.click();
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-recording'))
        ).toBe('false');
      }
      break;

    case MagicMockMode.OFF:
      // Want: both OFF
      if (isCurrentlyRecording) {
        await recordButton.click();
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-recording'))
        ).toBe('false');
      }
      if (isCurrentlyMocking) {
        await mockButton.click();
        await expect.poll(async () =>
          await page.evaluate(() => localStorage.getItem('magic-mock-mocking'))
        ).toBe('false');
      }
      break;
  }
}

/**
 * Helper to get current Magic Mock mode from localStorage
 * Returns 'record', 'mock', or 'off' based on the toggle states
 */
export async function getMagicMockMode(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const isRecording = localStorage.getItem('magic-mock-recording') === 'true';
    const isMocking = localStorage.getItem('magic-mock-mocking') === 'true';

    if (isRecording && !isMocking) return 'record';
    if (isMocking && !isRecording) return 'mock';
    return 'off';
  });
}

/**
 * Helper to clear Magic Mock cache and reset state
 * Clears localStorage cache and resets mode to OFF
 */
export async function clearMagicMockCache(page: Page) {
  await page.evaluate(() => {
    // Clear all localStorage items related to Magic Mock
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('magic-mock')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Reset mode to OFF
    localStorage.setItem('magic-mock-recording', 'false');
    localStorage.setItem('magic-mock-mocking', 'false');
  });
}

/**
 * Helper to count cached requests in localStorage
 */
export async function getCachedRequestCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('magicMock_cache_')) {
        count++;
      }
    }
    return count;
  });
}

/**
 * Network interceptor type for tracking HTTP requests
 */
export type NetworkInterceptor = {
  getRequestCount: () => number;
  getRequests: () => string[];
  reset: () => void;
};

/**
 * Helper to intercept and count network requests
 */
export async function setupNetworkInterceptor(page: Page): Promise<NetworkInterceptor> {
  const requests: string[] = [];

  page.on('request', (request) => {
    if (request.url().includes('pokeapi.co')) {
      requests.push(request.url());
    }
  });

  return {
    getRequestCount: () => requests.length,
    getRequests: () => [...requests],
    reset: () => {
      requests.length = 0;
    },
  };
}

/**
 * Helper to verify that requests are being served from cache (mocked)
 * In mock mode, requests should be much faster than in record mode
 */
export async function verifyRequestsAreMocked(actualTime: number, recordTime: number) {
  // Mocked requests should be significantly faster than real API calls
  // We expect at least 50% faster, but usually they're 90%+ faster
  const speedupRatio = recordTime / actualTime;

  // This is a loose check - mocked responses should be at least 2x faster
  expect(speedupRatio).toBeGreaterThan(2);
}

/**
 * Helper to verify that requests are hitting the real API (recording)
 */
export async function verifyRequestsAreReal(networkInterceptor: NetworkInterceptor, expectedCount: number) {
  const actualCount = networkInterceptor.getRequestCount();
  expect(actualCount).toBe(expectedCount);

  const requests = networkInterceptor.getRequests();
  expect(requests.length).toBe(expectedCount);

  // All requests should be to the real API
  requests.forEach((url) => {
    expect(url).toContain('https://pokeapi.co/api/v2/pokemon/');
  });
}
