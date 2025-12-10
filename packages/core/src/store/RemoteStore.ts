import { getConfig } from '../config/endpoints'
import { CacheRecord, MagicMockConfig } from '../types'
import { calculateFileDelay } from '../utils'
import { Store } from './Store'

export class RemoteStore implements Store {
  private sizeLimit: number
  private config: MagicMockConfig

  constructor(sizeLimit: number = 1000000) {
    this.sizeLimit = sizeLimit
    this.config = getConfig()
  }

  async get(
    originalFetch: typeof window.fetch,
    options: { url: string; method: string; body?: string },
  ): Promise<Response> {
    const { url, method, body } = options
    const params = new URLSearchParams({
      url,
      method,
      ...(body && { body }),
    })

    const cacheResponse = await originalFetch(
      `${this.config.apiPrefix}${this.config.getCachePath}?${params}`,
    )

    if (!cacheResponse.ok) {
      throw new Error('Cache not found')
    }
    // TODO: Should narrow this type assertion
    const cached = (await cacheResponse.json()) as Record<string, unknown>
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
      return new Response(cached.response, {
        status: cached.status as number | undefined,
        headers: cached.headers as HeadersInit | undefined,
      })
    }

    return new Response(JSON.stringify(cached.response), {
      status: cached.status as number | undefined,
      headers: cached.headers as HeadersInit | undefined,
    })
  }

  async set(
    originalFetch: typeof window.fetch,
    options: {
      url: string
      method: string
      body?: string
      data: string | Record<string, unknown>
      response?: Response
    },
  ): Promise<void> {
    const { url, method, body, data, response } = options

    // Check body size against limit
    if (this.sizeLimit > 0 && body) {
      const bodySize = new Blob([body]).size
      if (bodySize > this.sizeLimit) {
        console.warn(`⚠️ Body too large to cache (${bodySize} bytes, limit: ${this.sizeLimit})`)
        return
      }
    }

    const status = response?.status
    const headers = response ? response.headers : []
    const record: CacheRecord = {
      url,
      method,
      body,
      response: data,
      status,
      headers: Object.fromEntries(headers.entries()),
    }

    const res = await originalFetch(`${this.config.apiPrefix}${this.config.setCachePath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
    if (!res.ok) {
      throw new Error(`${response?.status} ${response?.statusText}`)
    } else {
      console.log('✅ Cached:', method, url)
    }
  }
}
