import { HttpResponse } from 'msw'
import { LocalRecord } from '../types'
import { Store } from './Store'

export class LocalStore implements Store {
  async get(_: typeof window.fetch, options: { url: string }) {
    const { url } = options
    const cacheResponse = localStorage.getItem(url)

    if (!cacheResponse) {
      throw new Error('Cache not found')
    }

    const cached = JSON.parse(cacheResponse) as LocalRecord
    console.log('🔄 Serving from cache:', url)

    // Should match RemoteRecorder:
    if (typeof cached.response === 'string') {
      return new HttpResponse(cached.response, { status: 200, headers: {} })
    }
    return HttpResponse.json(cached.response, { status: 200, headers: {} })
  }

  async set(
    _: typeof window.fetch,
    options: { url: string; data: string | Record<string, unknown>; response?: Response },
  ): Promise<void> {
    const { url, data } = options

    localStorage.setItem(url, JSON.stringify({ url, response: data }))

    console.log('✅ Cached with Local Storage:', url)
  }
}
