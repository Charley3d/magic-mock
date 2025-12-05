import { LocalRecord } from '../types'
import { calculateFileDelay, generateCacheKey } from '../utils'
import { Store } from './Store'

export class LocalStore implements Store {
  private sizeLimit: number

  constructor(sizeLimit: number = 50000) {
    this.sizeLimit = sizeLimit
  }

  async get(
    _: typeof window.fetch,
    options: { url: string; method: string; body?: string },
  ): Promise<Response> {
    const { url, method, body } = options
    const cacheKey = generateCacheKey(method, url, body)
    const cacheResponse = localStorage.getItem(cacheKey)

    if (!cacheResponse) {
      throw new Error('Cache not found')
    }

    const cached = JSON.parse(cacheResponse) as LocalRecord

    console.log('🔄 Serving from cache:', method, url)
    // Apply fake delay if file metadata detected
    if (body) {
      const delay = calculateFileDelay(body)
      if (delay > 0) {
        console.log(`⏱️ Simulating upload delay: ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Return native Response instead of MSW HttpResponse
    if (typeof cached.response === 'string') {
      return new Response(cached.response, { status: 200, headers: {} })
    }
    return new Response(JSON.stringify(cached.response), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  async set(
    _: typeof window.fetch,
    options: {
      url: string
      method: string
      body?: string
      data: string | Record<string, unknown>
      response?: Response
    },
  ): Promise<void> {
    const { url, method, body, data } = options

    // Check body size against limit
    if (this.sizeLimit > 0 && body) {
      const bodySize = new Blob([body]).size
      if (bodySize > this.sizeLimit) {
        console.warn(`⚠️ Body too large to cache (${bodySize} bytes, limit: ${this.sizeLimit})`)
        return
      }
    }

    const cacheKey = generateCacheKey(method, url, body)
    const record: LocalRecord = {
      url,
      method,
      body,
      response: data,
    }

    localStorage.setItem(cacheKey, JSON.stringify(record))

    console.log('✅ Cached with Local Storage:', method, url)
  }
}
