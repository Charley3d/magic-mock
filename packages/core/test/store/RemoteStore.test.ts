import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RemoteStore } from '../../src/store/RemoteStore'
import { CacheRecord } from '../../src/types'
import { createMockResponse } from '../test-utils'

describe('RemoteStore', () => {
  let store: RemoteStore
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store = new RemoteStore()
    mockFetch = vi.fn()
  })

  describe('constructor', () => {
    it('should create store with default size limit', () => {
      const defaultStore = new RemoteStore()
      expect(defaultStore).toBeInstanceOf(RemoteStore)
    })

    it('should create store with custom size limit', () => {
      const customStore = new RemoteStore(2000000)
      expect(customStore).toBeInstanceOf(RemoteStore)
    })

    it('should accept zero as size limit', () => {
      const unlimitedStore = new RemoteStore(0)
      expect(unlimitedStore).toBeInstanceOf(RemoteStore)
    })
  })

  describe('get', () => {
    it('should fetch cached response from remote API', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const cachedData: CacheRecord = {
        url,
        method,
        response: { users: [1, 2, 3] },
        status: 200,
        headers: { 'content-type': 'application/json' },
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(cachedData, {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

      const response = await store.get(mockFetch, { url, method })

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/__magic-mock/__get-cache?'))
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`url=${encodeURIComponent(url)}`),
      )
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(`method=${method}`))

      expect(response).toBeInstanceOf(Response)
      const data = await response.json()
      expect(data).toEqual({ users: [1, 2, 3] })
    })

    it('should include body in query params when provided', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ filter: 'active' })
      const cachedData: CacheRecord = {
        url,
        method,
        body,
        response: { users: [] },
        status: 200,
        headers: {},
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      await store.get(mockFetch, { url, method, body })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`body=${encodeURIComponent(body)}`),
      )
    })

    it('should throw error when cache is not found', async () => {
      const url = 'http://example.com/api/nonexistent'
      const method = 'GET'

      mockFetch.mockResolvedValueOnce(createMockResponse('Not found', { status: 404 }))

      await expect(store.get(mockFetch, { url, method })).rejects.toThrow('Cache not found')
    })

    it('should log cache hit message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const url = 'http://example.com/api/users'
      const method = 'GET'
      const cachedData: CacheRecord = {
        url,
        method,
        response: 'test',
        status: 200,
        headers: {},
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      await store.get(mockFetch, { url, method })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Serving from cache:'),
        method,
        url,
      )

      consoleLogSpy.mockRestore()
    })

    it('should return Response with correct status and headers', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const cachedData: CacheRecord = {
        url,
        method,
        response: { message: 'success' },
        status: 201,
        headers: { 'x-custom-header': 'value' },
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      const response = await store.get(mockFetch, { url, method })

      expect(response.status).toBe(201)
      expect(response.headers.get('x-custom-header')).toBe('value')
    })

    it('should handle string responses', async () => {
      const url = 'http://example.com/api/text'
      const method = 'GET'
      const cachedData: CacheRecord = {
        url,
        method,
        response: 'plain text response',
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      const response = await store.get(mockFetch, { url, method })
      const text = await response.text()

      expect(text).toBe('plain text response')
    })

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
      const cachedData: CacheRecord = {
        url,
        method,
        body,
        response: { success: true },
        status: 200,
        headers: {},
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await store.get(mockFetch, { url, method, body })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Simulating upload delay: \d+ms/),
      )

      consoleLogSpy.mockRestore()
    }, 15000) // 15 second timeout for delay test

    it('should not apply delay for non-file requests', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ name: 'test' })
      const cachedData: CacheRecord = {
        url,
        method,
        body,
        response: { id: 1 },
        status: 200,
        headers: {},
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await store.get(mockFetch, { url, method, body })

      const delayLogs = consoleLogSpy.mock.calls.filter((call) =>
        call.some((arg) => String(arg).includes('Simulating upload delay')),
      )
      expect(delayLogs).toHaveLength(0)

      consoleLogSpy.mockRestore()
    })
  })

  describe('set', () => {
    it('should send cache record to remote API', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { id: 1, name: 'Test User' }
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      expect(mockFetch).toHaveBeenCalledWith('/__magic-mock/__set-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })

      const callArgs = mockFetch.mock.calls[0]
      const sentBody = JSON.parse(callArgs[1].body)
      expect(sentBody.url).toBe(url)
      expect(sentBody.method).toBe(method)
      expect(sentBody.response).toEqual(data)
    })

    it('should include request body in cache record', async () => {
      const url = 'http://example.com/api/users'
      const method = 'POST'
      const body = JSON.stringify({ name: 'New User' })
      const data = { id: 2, name: 'New User' }
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, {
        url,
        method,
        body,
        data,
        response,
      })

      const callArgs = mockFetch.mock.calls[0]
      const sentBody = JSON.parse(callArgs[1].body)
      expect(sentBody.body).toBe(body)
    })

    it('should include response status and headers', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { message: 'ok' }
      const response = createMockResponse(data, {
        status: 201,
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'value',
        },
      })

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      const callArgs = mockFetch.mock.calls[0]
      const sentBody = JSON.parse(callArgs[1].body)
      expect(sentBody.status).toBe(201)
      expect(sentBody.headers['content-type']).toBe('application/json')
      expect(sentBody.headers['x-custom-header']).toBe('value')
    })

    it('should throw error when remote API returns error', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { id: 1 }
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(
        createMockResponse('Server Error', { status: 500, statusText: 'Internal Server Error' }),
      )

      await expect(
        store.set(mockFetch, {
          url,
          method,
          data,
          response,
        }),
      ).rejects.toThrow()
    })

    it('should log success message when caching', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = 'test'
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, {
        url,
        method,
        data,
        response,
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cached:'), method, url)

      consoleLogSpy.mockRestore()
    })

    it('should not cache when body exceeds size limit', async () => {
      const smallStore = new RemoteStore(100)
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const largeBody = 'x'.repeat(200)
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
      expect(mockFetch).not.toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should cache when size limit is 0 (unlimited)', async () => {
      const unlimitedStore = new RemoteStore(0)
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const largeBody = 'x'.repeat(100000)
      const data = { success: true }
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await unlimitedStore.set(mockFetch, {
        url,
        method,
        body: largeBody,
        data,
        response,
      })

      expect(mockFetch).toHaveBeenCalledWith('/__magic-mock/__set-cache', expect.any(Object))
    })

    it('should cache when body is within size limit', async () => {
      const store = new RemoteStore(1000)
      const url = 'http://example.com/api/upload'
      const method = 'POST'
      const smallBody = 'x'.repeat(50)
      const data = { success: true }
      const response = createMockResponse(data)

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, {
        url,
        method,
        body: smallBody,
        data,
        response,
      })

      expect(mockFetch).toHaveBeenCalledWith('/__magic-mock/__set-cache', expect.any(Object))
    })
  })

  describe('integration tests', () => {
    it('should handle complete set and get cycle', async () => {
      const url = 'http://example.com/api/users'
      const method = 'GET'
      const data = { users: [1, 2, 3] }
      const response = createMockResponse(data)

      // Mock set response
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      await store.set(mockFetch, { url, method, data, response })

      // Mock get response
      const cachedData: CacheRecord = {
        url,
        method,
        response: data,
        status: 200,
        headers: {},
      }
      mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

      const retrieved = await store.get(mockFetch, { url, method })
      const retrievedData = await retrieved.json()

      expect(retrievedData).toEqual(data)
    })

    it('should handle multiple different requests', async () => {
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
      ]

      // Cache all requests
      for (const req of requests) {
        mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
        await store.set(mockFetch, {
          url: req.url,
          method: req.method,
          data: req.data,
          response: createMockResponse(req.data),
        })
      }

      // Retrieve all
      for (const req of requests) {
        const cachedData: CacheRecord = {
          url: req.url,
          method: req.method,
          response: req.data,
          status: 200,
          headers: {},
        }
        mockFetch.mockResolvedValueOnce(createMockResponse(cachedData))

        const retrieved = await store.get(mockFetch, {
          url: req.url,
          method: req.method,
        })
        const data = await retrieved.json()
        expect(data).toEqual(req.data)
      }
    })
  })
})
