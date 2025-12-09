import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LocalStore } from '../../src/store/LocalStore'
import { createMockResponse } from '../test-utils'

describe('LocalStore', () => {
  let store: LocalStore
  let mockFetch: typeof fetch

  beforeEach(() => {
    store = new LocalStore()
    mockFetch = vi.fn() as any
    localStorage.clear()
  })

  describe('constructor', () => {
    it('should create store with default size limit', () => {
      const defaultStore = new LocalStore()
      expect(defaultStore).toBeInstanceOf(LocalStore)
    })

    it('should create store with custom size limit', () => {
      const customStore = new LocalStore(100000)
      expect(customStore).toBeInstanceOf(LocalStore)
    })

    it('should accept zero as size limit', () => {
      const unlimitedStore = new LocalStore(0)
      expect(unlimitedStore).toBeInstanceOf(LocalStore)
    })
  })

  describe('set', () => {
    it('should store string response in localStorage', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = 'response text'
      const response = createMockResponse(data)

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeTruthy()

      const parsed = JSON.parse(cached!)
      expect(parsed.url).toBe(url)
      expect(parsed.method).toBe(method)
      expect(parsed.response).toBe(data)
    })

    it('should store JSON response in localStorage', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { id: 1, name: 'Test User' }
      const response = createMockResponse(data, {
        headers: { 'content-type': 'application/json' },
      })

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeTruthy()

      const parsed = JSON.parse(cached!)
      expect(parsed.response).toEqual(data)
    })

    it('should store request with body', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ name: 'New User' })
      const data = { id: 2, name: 'New User' }
      const response = createMockResponse(data)

      await store.set(mockFetch, {
        url,
        method,
        body,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::${body}`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeTruthy()

      const parsed = JSON.parse(cached!)
      expect(parsed.body).toBe(body)
      expect(parsed.method).toBe(method)
    })

    it('should store response status and headers', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { message: 'ok' }
      const response = createMockResponse(data, {
        status: 201,
        statusText: 'Created',
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'value',
        },
      })

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::`
      const cached = localStorage.getItem(cacheKey)
      const parsed = JSON.parse(cached!)

      expect(parsed.status).toBe(201)
      expect(parsed.headers['content-type']).toBe('application/json')
      expect(parsed.headers['x-custom-header']).toBe('value')
    })

    it('should not cache when body exceeds size limit', async () => {
      const smallStore = new LocalStore(100) // 100 bytes limit
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const largeBody = 'x'.repeat(200) // 200 bytes
      const data = { success: true }
      const response = createMockResponse(data)

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await smallStore.set(mockFetch, {
        url,
        method,
        body: largeBody,
        data,
        response,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Body too large to cache'),
      )

      const cacheKey = `${method.toUpperCase()}::${url}::${largeBody}`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeNull()

      consoleWarnSpy.mockRestore()
    })

    it('should cache when size limit is 0 (unlimited)', async () => {
      const unlimitedStore = new LocalStore(0)
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const largeBody = 'x'.repeat(100000) // Very large body
      const data = { success: true }
      const response = createMockResponse(data)

      await unlimitedStore.set(mockFetch, {
        url,
        method,
        body: largeBody,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::${largeBody}`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeTruthy()
    })

    it('should cache when body is within size limit', async () => {
      const store = new LocalStore(1000)
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const smallBody = 'x'.repeat(50)
      const data = { success: true }
      const response = createMockResponse(data)

      await store.set(mockFetch, {
        url,
        method,
        body: smallBody,
        data,
        response,
      })

      const cacheKey = `${method.toUpperCase()}::${url}::${smallBody}`
      const cached = localStorage.getItem(cacheKey)
      expect(cached).toBeTruthy()
    })

    it('should log success message when caching', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = 'test'
      const response = createMockResponse(data)

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cached with Local Storage:'),
        method,
        url,
      )

      consoleLogSpy.mockRestore()
    })
  })

  describe('get', () => {
    it('should retrieve cached response from localStorage', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { id: 1, name: 'Test' }
      const response = createMockResponse(data)

      // First, cache the response
      await store.set(mockFetch, { url, method, data, response })

      // Then retrieve it
      const retrieved = await store.get(mockFetch, { url, method })

      expect(retrieved).toBeInstanceOf(Response)
      const retrievedData = await retrieved.json()
      expect(retrievedData).toEqual(data)
    })

    it('should retrieve cached string response', async () => {
      const url = 'http://example.com/api/text'
      const method = 'GET'
      const data = 'plain text response'
      const response = createMockResponse(data)

      await store.set(mockFetch, { url, method, data, response })

      const retrieved = await store.get(mockFetch, { url, method })
      const text = await retrieved.text()
      expect(text).toBe(data)
    })

    it('should retrieve cached response with specific body', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ filter: 'active' })
      const data = { users: [1, 2, 3] }
      const response = createMockResponse(data)

      await store.set(mockFetch, { url, method, body, data, response })

      const retrieved = await store.get(mockFetch, { url, method, body })
      const retrievedData = await retrieved.json()
      expect(retrievedData).toEqual(data)
    })

    it('should throw error when cache not found', async () => {
      const url = 'http://example.com/api/nonexistent'
      const method = 'GET'

      await expect(store.get(mockFetch, { url, method })).rejects.toThrow('Cache not found')
    })

    it('should log cache hit message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = 'test'
      const response = createMockResponse(data)

      await store.set(mockFetch, { url, method, data, response })
      await store.get(mockFetch, { url, method })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Serving from cache:'),
        method,
        url,
      )

      consoleLogSpy.mockRestore()
    })

    it('should preserve response status and headers', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { message: 'success' }
      const response = createMockResponse(data, {
        status: 201,
        headers: { 'x-custom': 'value' },
      })

      await store.set(mockFetch, { url, method, data, response })
      const retrieved = await store.get(mockFetch, { url, method })

      expect(retrieved.status).toBe(201)
      expect(retrieved.headers.get('x-custom')).toBe('value')
    })

    // TODO: This is odd, it does not really control delay. Rework this into a fiable test
    it('should apply delay for file uploads', async () => {
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const fileMetadata = {
        file: {
          _file: true,
          name: 'test.txt',
          size: 10485760, // 10MB
          type: 'text/plain',
        },
      }
      const body = JSON.stringify(fileMetadata)
      const data = { success: true }
      const response = createMockResponse(data)

      await store.set(mockFetch, { url, method, body, data, response })

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await store.get(mockFetch, { url, method, body })

      // Check the log was called with delay message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Simulating upload delay: \d+ms/),
      )

      consoleLogSpy.mockRestore()
    }, 15000) // 15 second timeout for delay test

    it('should not apply delay for non-file requests', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ name: 'test' })
      const data = { id: 1 }
      const response = createMockResponse(data)

      await store.set(mockFetch, { url, method, body, data, response })

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await store.get(mockFetch, { url, method, body })

      // Should not log delay message
      const delayLogs = consoleLogSpy.mock.calls.filter((call) =>
        call.some((arg) => String(arg).includes('Simulating upload delay')),
      )
      expect(delayLogs).toHaveLength(0)

      consoleLogSpy.mockRestore()
    })

    it('should handle different cache keys correctly', async () => {
      const url = 'http://example.com/api/users'

      // Cache GET request
      await store.set(mockFetch, {
        url,
        method: 'GET',
        data: { type: 'GET data' },
        response: createMockResponse({ type: 'GET data' }),
      })

      // Cache POST request
      await store.set(mockFetch, {
        url,
        method: 'POST',
        data: { type: 'POST data' },
        response: createMockResponse({ type: 'POST data' }),
      })

      // Retrieve GET - should get GET data
      const getResponse = await store.get(mockFetch, { url, method: 'GET' })
      const getData = await getResponse.json()
      expect(getData).toEqual({ type: 'GET data' })

      // Retrieve POST - should get POST data
      const postResponse = await store.get(mockFetch, { url, method: 'POST' })
      const postData = await postResponse.json()
      expect(postData).toEqual({ type: 'POST data' })
    })
  })

  describe('integration tests', () => {
    it('should handle complete set and get cycle', async () => {
      const requests = [
        {
          url: 'http://example.com/api/users',
          method: 'GET',
          data: { users: [1, 2, 3] },
        },
        {
          url: 'http://example.com/api/posts',
          method: 'GET',
          data: { posts: ['a', 'b', 'c'] },
        },
        {
          url: 'http://example.com/api/users',
          method: 'POST',
          body: JSON.stringify({ name: 'New User' }),
          data: { id: 4, name: 'New User' },
        },
      ]

      // Cache all requests
      for (const req of requests) {
        await store.set(mockFetch, {
          url: req.url,
          method: req.method,
          body: req.body,
          data: req.data,
          response: createMockResponse(req.data),
        })
      }

      // Retrieve all and verify
      for (const req of requests) {
        const retrieved = await store.get(mockFetch, {
          url: req.url,
          method: req.method,
          body: req.body,
        })
        const data = await retrieved.json()
        expect(data).toEqual(req.data)
      }
    })

    it('should overwrite existing cache entry', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'

      // First cache
      await store.set(mockFetch, {
        url,
        method,
        data: { version: 1 },
        response: createMockResponse({ version: 1 }),
      })

      // Update cache
      await store.set(mockFetch, {
        url,
        method,
        data: { version: 2 },
        response: createMockResponse({ version: 2 }),
      })

      // Should get updated version
      const retrieved = await store.get(mockFetch, { url, method })
      const data = await retrieved.json()
      expect(data).toEqual({ version: 2 })
    })
  })
})
