import { beforeEach, vi } from 'vitest'

// Mock __STANDALONE__ global
global.__STANDALONE__ = false

// Setup browser-like environment
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear()

  // Reset console mocks to avoid pollution between tests
  vi.clearAllMocks()

  // Reset DOM
  document.body.innerHTML = ''

  // Ensure location.href is set (jsdom provides this but we make it explicit)
  if (!window.location.href) {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000' },
      writable: true,
    })
  }
})
