import { StoredMedia } from './types'

/**
 * Encode URL to safe filename using browser-compatible base64 encoding
 * Uses URL-safe base64 variant: / -> _ and + -> - , removes padding =
 */
export function urlToFilename(url: string): string {
  const base64 = btoa(url).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')
  return base64 + '.json'
}

/**
 * Decode filename back to URL using browser-compatible base64 decoding
 * Reverses URL-safe base64: _ -> / and - -> + , restores padding
 */
export function filenameToUrl(filename: string): string {
  // Remove .json extension
  let base64 = filename.replace('.json', '')

  // Restore base64 characters
  base64 = base64.replace(/_/g, '/').replace(/-/g, '+')

  // Restore padding
  const paddingNeeded = (4 - (base64.length % 4)) % 4
  base64 = base64 + '='.repeat(paddingNeeded)

  return atob(base64)
}

export const isMedia = (url: URL) => {
  return /\.(jpe?g|png|gif|svg|webp|ico|mp4|mp3|woff2?|ttf|css|js)$/i.test(url.pathname)
}

export const isApi = (url: URL) => {
  return url.pathname.includes('/api/__')
}

export const getURL = (input: string | URL | Request): URL | null => {
  try {
    if (typeof input === 'string') return new URL(input, location.href)
    if (input instanceof URL) return input
    if (input instanceof Request) return new URL(input.url, location.href)
    return null
  } catch {
    return null
  }
}

export const isMethodAllowed = (method: string) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
  return allowedMethods.includes(method.toUpperCase())
}

/**
 * Generate cache key from method, URL, and optional body
 */
export const generateCacheKey = (method: string, url: string, body?: string): string => {
  return `${method.toUpperCase()}::${url}::${body || ''}`
}

/**
 * Serialize FormData to JSON with file metadata
 */
export const serializeFormData = (formData: FormData): string => {
  const serialized: Record<string, unknown | StoredMedia> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') {
      ;(serialized[key] as StoredMedia) = {
        _file: true,
        name: value.name || 'blob',
        size: value.size,
        type: value.type,
      }
    } else {
      serialized[key] = value
    }
  }
  return JSON.stringify(serialized)
}

/**
 * Calculate fake delay for file uploads based on file size
 * @param body - Serialized request body
 * @param uploadSpeed - Upload speed in bytes/second (default: 1MB/s)
 * @returns Delay in milliseconds
 */
export const calculateFileDelay = (body: string, uploadSpeed: number = 1048576): number => {
  try {
    const parsed = JSON.parse(body)
    let totalSize = 0

    // Type guard for StoredMedia
    const isStoredMedia = (obj: unknown): obj is StoredMedia => {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        '_file' in obj &&
        obj._file === true &&
        'size' in obj &&
        typeof obj.size === 'number'
      )
    }

    // Find all file metadata objects and sum their sizes
    const findFiles = (obj: unknown): void => {
      if (isStoredMedia(obj)) {
        totalSize += obj.size
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(findFiles)
      }
    }

    findFiles(parsed)

    if (totalSize > 0) {
      // Calculate delay in milliseconds
      return Math.round((totalSize / uploadSpeed) * 1000)
    }
  } catch {
    // If parsing fails or no files found, no delay
  }

  return 0
}

/**
 * Shared helper: Serialize request body to string for caching
 * Supports FormData (with file metadata), Document (XML), and generic bodies
 */
export function serializeBody(body: any): string | undefined {
  if (!body) return undefined
  if (body instanceof FormData) return serializeFormData(body)
  if (body instanceof Document) return new XMLSerializer().serializeToString(body)
  if (typeof body === 'string') return body
  // Handle Blob, ArrayBuffer, etc. by converting to string
  return String(body)
}

/**
 * Check if request is eligible for caching/storage
 * Excludes media files, internal API calls, and unsupported methods
 */
export function isCacheable(url: URL | null, method: string): boolean {
  return !!(url && !isMedia(url) && !isApi(url) && isMethodAllowed(method))
}

export const originalFetch = window.fetch
export const originalXMLHttpRequest = window.XMLHttpRequest

export const isRecording = () => localStorage.getItem('magic-mock-recording') === 'true'
export const isMocking = () => localStorage.getItem('magic-mock-mocking') === 'true'
