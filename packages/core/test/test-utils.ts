import { vi } from 'vitest'

/**
 * Create a mock fetch function that can be controlled in tests
 */
export function createMockFetch() {
  return vi.fn<typeof fetch>()
}

/**
 * Create a mock Response object
 */
export function createMockResponse(
  body: any,
  init?: ResponseInit & { headers?: Record<string, string> },
): Response {
  const headers = new Headers(init?.headers || {})
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: init?.status || 200,
    statusText: init?.statusText || 'OK',
    headers,
  })
}

/**
 * Create a mock XMLHttpRequest instance with controllable behavior
 */
export class MockXMLHttpRequest {
  readyState = 0
  status = 0
  statusText = ''
  responseText = ''
  response: any = ''

  private listeners: Record<string, Array<(event: Event) => void>> = {}
  private _method = ''
  private _url = ''

  open(method: string, url: string) {
    this._method = method
    this._url = url
    this.readyState = 1
  }

  send(body?: any) {
    // Override in tests to control behavior
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(listener)
  }

  removeEventListener(type: string, listener: (event: Event) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener)
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners[event.type] || []
    listeners.forEach((listener) => listener(event))
    return true
  }

  getResponseHeader(name: string): string | null {
    return null
  }

  getAllResponseHeaders(): string {
    return ''
  }

  setRequestHeader(name: string, value: string) {}

  abort() {}
}

/**
 * Mock localStorage operations for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get store() {
      return { ...store }
    },
  }
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a mock FormData with file
 */
export function createMockFormData(entries: Record<string, string | File>): FormData {
  const formData = new FormData()
  Object.entries(entries).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

/**
 * Create a mock File object
 */
export function createMockFile(
  content: string,
  filename: string,
  options?: { type?: string; size?: number },
): File {
  const blob = new Blob([content], { type: options?.type || 'text/plain' })
  return new File([blob], filename, { type: options?.type || 'text/plain' })
}

/**
 * Setup recording mode in localStorage
 */
export function enableRecordingMode() {
  localStorage.setItem('magic-mock-recording', 'true')
  localStorage.setItem('magic-mock-mocking', 'false')
}

/**
 * Setup mocking mode in localStorage
 */
export function enableMockingMode() {
  localStorage.setItem('magic-mock-recording', 'false')
  localStorage.setItem('magic-mock-mocking', 'true')
}

/**
 * Disable both recording and mocking modes
 */
export function disableAllModes() {
  localStorage.setItem('magic-mock-recording', 'false')
  localStorage.setItem('magic-mock-mocking', 'false')
}
