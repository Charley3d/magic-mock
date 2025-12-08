import { describe, it, expect, beforeEach } from 'vitest'
import {
  urlToFilename,
  filenameToUrl,
  isMedia,
  isApi,
  getURL,
  isMethodAllowed,
  generateCacheKey,
  serializeFormData,
  calculateFileDelay,
  serializeBody,
  isCacheable,
  isRecording,
  isMocking,
} from '../src/utils'
import { createMockFormData, createMockFile, TEST_FILE_SIZES } from './test-utils'

describe('utils', () => {
  describe('urlToFilename', () => {
    it('should encode URL to base64 filename', () => {
      const url = 'https://api.example.com/users'
      const filename = urlToFilename(url)

      // URL-safe base64: uses A-Z, a-z, 0-9, _ (for /), and - (for +)
      expect(filename).toMatch(/^[A-Za-z0-9_-]+\.json$/)
      expect(filename).not.toContain('/')
      expect(filename).not.toContain('+')
      expect(filename).not.toContain('=')
    })

    it('should handle URLs with special characters', () => {
      const url = 'https://api.example.com/users?id=123&name=test'
      const filename = urlToFilename(url)

      // URL-safe base64: should not contain / + or =
      expect(filename).toMatch(/^[A-Za-z0-9_-]+\.json$/)
      expect(filename).not.toContain('/')
      expect(filename).not.toContain('+')
      expect(filename).not.toContain('=')
    })

    it('should produce consistent output for same URL', () => {
      const url = 'https://api.example.com/users'
      const filename1 = urlToFilename(url)
      const filename2 = urlToFilename(url)

      expect(filename1).toBe(filename2)
    })
  })

  describe('filenameToUrl', () => {
    it('should decode filename back to original URL', () => {
      const originalUrl = 'https://api.example.com/users'
      const filename = urlToFilename(originalUrl)
      const decodedUrl = filenameToUrl(filename)

      expect(decodedUrl).toBe(originalUrl)
    })

    it('should handle filenames with underscores', () => {
      const originalUrl = 'https://api.example.com/users?query=test'
      const filename = urlToFilename(originalUrl)
      const decodedUrl = filenameToUrl(filename)

      expect(decodedUrl).toBe(originalUrl)
    })
  })

  describe('isMedia', () => {
    it('should return true for image files', () => {
      expect(isMedia(new URL('http://example.com/image.jpg'))).toBe(true)
      expect(isMedia(new URL('http://example.com/image.jpeg'))).toBe(true)
      expect(isMedia(new URL('http://example.com/image.png'))).toBe(true)
      expect(isMedia(new URL('http://example.com/image.gif'))).toBe(true)
      expect(isMedia(new URL('http://example.com/image.svg'))).toBe(true)
      expect(isMedia(new URL('http://example.com/image.webp'))).toBe(true)
      expect(isMedia(new URL('http://example.com/favicon.ico'))).toBe(true)
    })

    it('should return true for video files', () => {
      expect(isMedia(new URL('http://example.com/video.mp4'))).toBe(true)
    })

    it('should return true for audio files', () => {
      expect(isMedia(new URL('http://example.com/audio.mp3'))).toBe(true)
    })

    it('should return true for font files', () => {
      expect(isMedia(new URL('http://example.com/font.woff'))).toBe(true)
      expect(isMedia(new URL('http://example.com/font.woff2'))).toBe(true)
      expect(isMedia(new URL('http://example.com/font.ttf'))).toBe(true)
    })

    it('should return true for CSS and JS files', () => {
      expect(isMedia(new URL('http://example.com/style.css'))).toBe(true)
      expect(isMedia(new URL('http://example.com/script.js'))).toBe(true)
    })

    it('should return false for API endpoints', () => {
      expect(isMedia(new URL('http://example.com/api/users'))).toBe(false)
      expect(isMedia(new URL('http://example.com/data'))).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isMedia(new URL('http://example.com/IMAGE.JPG'))).toBe(true)
      expect(isMedia(new URL('http://example.com/Video.MP4'))).toBe(true)
    })
  })

  describe('isApi', () => {
    it('should return true for internal API endpoints', () => {
      expect(isApi(new URL('http://localhost:3000/api/__get-cache'))).toBe(true)
      expect(isApi(new URL('http://localhost:3000/api/__record'))).toBe(true)
      expect(isApi(new URL('http://localhost:3000/api/__anything'))).toBe(true)
    })

    it('should return false for regular API endpoints', () => {
      expect(isApi(new URL('http://localhost:3000/api/users'))).toBe(false)
      expect(isApi(new URL('http://localhost:3000/api/posts'))).toBe(false)
    })

    it('should return false for non-API URLs', () => {
      expect(isApi(new URL('http://example.com/users'))).toBe(false)
      expect(isApi(new URL('http://example.com/'))).toBe(false)
    })
  })

  describe('getURL', () => {
    beforeEach(() => {
      // Ensure location.href is set for relative URLs
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000' },
        writable: true,
        configurable: true,
      })
    })

    it('should parse string URL', () => {
      const url = getURL('http://example.com/api/users')
      expect(url).toBeInstanceOf(URL)
      expect(url?.href).toBe('http://example.com/api/users')
    })

    it('should parse relative URL string', () => {
      const url = getURL('/api/users')
      expect(url).toBeInstanceOf(URL)
      expect(url?.href).toBe('http://localhost:3000/api/users')
    })

    it('should return URL object as-is', () => {
      const inputUrl = new URL('http://example.com/api/users')
      const url = getURL(inputUrl)
      expect(url).toBe(inputUrl)
    })

    it('should extract URL from Request object', () => {
      const request = new Request('http://example.com/api/users')
      const url = getURL(request)
      expect(url).toBeInstanceOf(URL)
      expect(url?.href).toBe('http://example.com/api/users')
    })

    it('should return null for invalid input', () => {
      const url = getURL(null as any)
      expect(url).toBeNull()
    })

    it('should handle relative URLs by treating them as relative to location', () => {
      // In jsdom with location.href set, 'not a valid url' becomes relative
      const url = getURL('not a valid url')
      // It will either be null or a URL (relative to location.href)
      // Since location.href is set in setup, it will treat it as relative
      expect(url).toBeTruthy()
    })
  })

  describe('isMethodAllowed', () => {
    it('should return true for GET requests', () => {
      expect(isMethodAllowed('GET')).toBe(true)
      expect(isMethodAllowed('get')).toBe(true)
    })

    it('should return true for POST requests', () => {
      expect(isMethodAllowed('POST')).toBe(true)
      expect(isMethodAllowed('post')).toBe(true)
    })

    it('should return true for PUT requests', () => {
      expect(isMethodAllowed('PUT')).toBe(true)
      expect(isMethodAllowed('put')).toBe(true)
    })

    it('should return true for DELETE requests', () => {
      expect(isMethodAllowed('DELETE')).toBe(true)
      expect(isMethodAllowed('delete')).toBe(true)
    })

    it('should return false for PATCH requests', () => {
      expect(isMethodAllowed('PATCH')).toBe(false)
    })

    it('should return false for HEAD requests', () => {
      expect(isMethodAllowed('HEAD')).toBe(false)
    })

    it('should return false for OPTIONS requests', () => {
      expect(isMethodAllowed('OPTIONS')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isMethodAllowed('GeT')).toBe(true)
      expect(isMethodAllowed('PoSt')).toBe(true)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate cache key from method and URL', () => {
      const key = generateCacheKey('GET', 'http://example.com/api/users')
      expect(key).toBe('GET::http://example.com/api/users::')
    })

    it('should include body in cache key when provided', () => {
      const body = JSON.stringify({ name: 'test' })
      const key = generateCacheKey('POST', 'http://example.com/api/users', body)
      expect(key).toBe(`POST::http://example.com/api/users::${body}`)
    })

    it('should normalize method to uppercase', () => {
      const key = generateCacheKey('post', 'http://example.com/api/users')
      expect(key).toBe('POST::http://example.com/api/users::')
    })

    it('should generate different keys for different bodies', () => {
      const body1 = JSON.stringify({ name: 'test1' })
      const body2 = JSON.stringify({ name: 'test2' })
      const key1 = generateCacheKey('POST', 'http://example.com/api/users', body1)
      const key2 = generateCacheKey('POST', 'http://example.com/api/users', body2)
      expect(key1).not.toBe(key2)
    })

    it('should handle empty body as empty string in key', () => {
      const key = generateCacheKey('GET', 'http://example.com/api/users', undefined)
      expect(key).toContain('::')
      expect(key.endsWith('::')).toBe(true)
    })
  })

  describe('serializeFormData', () => {
    it('should serialize string fields', () => {
      const formData = createMockFormData({
        name: 'John',
        email: 'john@example.com',
      })

      const serialized = serializeFormData(formData)
      const parsed = JSON.parse(serialized)

      expect(parsed.name).toBe('John')
      expect(parsed.email).toBe('john@example.com')
    })

    it('should serialize file fields with metadata', () => {
      const file = createMockFile('file content', 'test.txt', { type: 'text/plain' })
      const formData = createMockFormData({
        file,
        name: 'Test',
      })

      const serialized = serializeFormData(formData)
      const parsed = JSON.parse(serialized)

      expect(parsed.name).toBe('Test')
      expect(parsed.file).toEqual({
        _file: true,
        name: 'test.txt',
        size: expect.any(Number),
        type: 'text/plain',
      })
    })

    it('should handle multiple file fields', () => {
      const file1 = createMockFile('content1', 'file1.txt')
      const file2 = createMockFile('content2', 'file2.txt')
      const formData = new FormData()
      formData.append('file1', file1)
      formData.append('file2', file2)

      const serialized = serializeFormData(formData)
      const parsed = JSON.parse(serialized)

      expect(parsed.file1._file).toBe(true)
      expect(parsed.file2._file).toBe(true)
      expect(parsed.file1.name).toBe('file1.txt')
      expect(parsed.file2.name).toBe('file2.txt')
    })

    it('should handle blobs with default name', () => {
      const blob = new Blob(['content'], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('data', blob)

      const serialized = serializeFormData(formData)
      const parsed = JSON.parse(serialized)

      expect(parsed.data).toEqual({
        _file: true,
        name: 'blob',
        size: expect.any(Number),
        type: 'text/plain',
      })
    })
  })

  describe('calculateFileDelay', () => {
    it('should return 0 for non-file body', () => {
      const body = JSON.stringify({ name: 'test' })
      const delay = calculateFileDelay(body)
      expect(delay).toBe(0)
    })

    it('should calculate delay based on file size', () => {
      const fileMetadata = {
        file: {
          _file: true,
          name: 'test.txt',
          size: TEST_FILE_SIZES.ONE_MB,
          type: 'text/plain',
        },
      }
      const body = JSON.stringify(fileMetadata)
      const delay = calculateFileDelay(body, TEST_FILE_SIZES.ONE_MB)
      expect(delay).toBe(1000) // Should be 1 second
    })

    it('should handle multiple files', () => {
      const fileMetadata = {
        file1: { _file: true, name: 'test1.txt', size: TEST_FILE_SIZES.HALF_MB, type: 'text/plain' },
        file2: { _file: true, name: 'test2.txt', size: TEST_FILE_SIZES.HALF_MB, type: 'text/plain' },
      }
      const body = JSON.stringify(fileMetadata)
      const delay = calculateFileDelay(body, TEST_FILE_SIZES.ONE_MB)
      expect(delay).toBe(1000) // Total 1MB at 1MB/s = 1 second
    })

    it('should use custom upload speed', () => {
      const fileMetadata = {
        file: {
          _file: true,
          name: 'test.txt',
          size: TEST_FILE_SIZES.ONE_MB,
          type: 'text/plain',
        },
      }
      const body = JSON.stringify(fileMetadata)
      const delay = calculateFileDelay(body, TEST_FILE_SIZES.TWO_MB)
      expect(delay).toBe(500) // Should be 0.5 seconds
    })

    it('should handle nested file objects', () => {
      const fileMetadata = {
        data: {
          nested: {
            file: {
              _file: true,
              name: 'test.txt',
              size: TEST_FILE_SIZES.ONE_MB,
              type: 'text/plain',
            },
          },
        },
      }
      const body = JSON.stringify(fileMetadata)
      const delay = calculateFileDelay(body)
      expect(delay).toBeGreaterThan(0)
    })

    it('should return 0 for invalid JSON', () => {
      const body = 'invalid json {'
      const delay = calculateFileDelay(body)
      expect(delay).toBe(0)
    })

    it('should round delay to nearest millisecond', () => {
      const fileMetadata = {
        file: {
          _file: true,
          name: 'test.txt',
          size: TEST_FILE_SIZES.ONE_HUNDRED_BYTES,
          type: 'text/plain',
        },
      }
      const body = JSON.stringify(fileMetadata)
      const delay = calculateFileDelay(body, TEST_FILE_SIZES.ONE_MB)
      expect(Number.isInteger(delay)).toBe(true)
    })
  })

  describe('serializeBody', () => {
    it('should return undefined for null or undefined', () => {
      expect(serializeBody(null)).toBeUndefined()
      expect(serializeBody(undefined)).toBeUndefined()
    })

    it('should return string as-is', () => {
      const body = 'test string'
      expect(serializeBody(body)).toBe(body)
    })

    it('should serialize FormData', () => {
      const formData = createMockFormData({ name: 'test' })
      const serialized = serializeBody(formData)
      expect(serialized).toContain('test')
      expect(() => JSON.parse(serialized!)).not.toThrow()
    })

    it('should serialize Document to XML', () => {
      const parser = new DOMParser()
      const doc = parser.parseFromString('<root><item>test</item></root>', 'text/xml')
      const serialized = serializeBody(doc)
      expect(serialized).toContain('<root>')
      expect(serialized).toContain('<item>test</item>')
    })

    it('should convert other types to string', () => {
      expect(serializeBody(123)).toBe('123')
      expect(serializeBody(true)).toBe('true')
      expect(serializeBody({ key: 'value' })).toBe('[object Object]')
    })
  })

  describe('isCacheable', () => {
    it('should return false for null URL', () => {
      expect(isCacheable(null, 'GET')).toBe(false)
    })

    it('should return false for media URLs', () => {
      const url = new URL('http://example.com/image.jpg')
      expect(isCacheable(url, 'GET')).toBe(false)
    })

    it('should return false for internal API endpoints', () => {
      const url = new URL('http://localhost:3000/api/__get-cache')
      expect(isCacheable(url, 'GET')).toBe(false)
    })

    it('should return false for disallowed methods', () => {
      const url = new URL('http://example.com/api/users')
      expect(isCacheable(url, 'PATCH')).toBe(false)
      expect(isCacheable(url, 'HEAD')).toBe(false)
    })

    it('should return true for cacheable URLs and methods', () => {
      const url = new URL('http://example.com/api/users')
      expect(isCacheable(url, 'GET')).toBe(true)
      expect(isCacheable(url, 'POST')).toBe(true)
      expect(isCacheable(url, 'PUT')).toBe(true)
      expect(isCacheable(url, 'DELETE')).toBe(true)
    })

    it('should handle case-insensitive methods', () => {
      const url = new URL('http://example.com/api/users')
      expect(isCacheable(url, 'get')).toBe(true)
      expect(isCacheable(url, 'post')).toBe(true)
    })
  })

  describe('isRecording', () => {
    it('should return true when recording is enabled', () => {
      localStorage.setItem('magic-mock-recording', 'true')
      expect(isRecording()).toBe(true)
    })

    it('should return false when recording is disabled', () => {
      localStorage.setItem('magic-mock-recording', 'false')
      expect(isRecording()).toBe(false)
    })

    it('should return false when key is not set', () => {
      localStorage.removeItem('magic-mock-recording')
      expect(isRecording()).toBe(false)
    })

    it('should return false for any value other than "true"', () => {
      localStorage.setItem('magic-mock-recording', 'yes')
      expect(isRecording()).toBe(false)
    })
  })

  describe('isMocking', () => {
    it('should return true when mocking is enabled', () => {
      localStorage.setItem('magic-mock-mocking', 'true')
      expect(isMocking()).toBe(true)
    })

    it('should return false when mocking is disabled', () => {
      localStorage.setItem('magic-mock-mocking', 'false')
      expect(isMocking()).toBe(false)
    })

    it('should return false when key is not set', () => {
      localStorage.removeItem('magic-mock-mocking')
      expect(isMocking()).toBe(false)
    })

    it('should return false for any value other than "true"', () => {
      localStorage.setItem('magic-mock-mocking', '1')
      expect(isMocking()).toBe(false)
    })
  })
})
