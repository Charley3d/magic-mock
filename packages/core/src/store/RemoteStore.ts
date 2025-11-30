import { HttpResponse } from 'msw'
import { Store } from './Store'

export class RemoteStore implements Store {
  async get(originalFetch: typeof window.fetch, options: { url: string }) {
    const { url } = options
    const cacheResponse = await originalFetch('/api/__get-cache?url=' + encodeURIComponent(url))

    if (!cacheResponse.ok) {
      throw new Error('Cache not found')
    }

    const cached = await cacheResponse.json()
    console.log('🔄 Serving from cache:', url)

    if (typeof cached.response === 'string') {
      return new HttpResponse(cached.response, { status: cached.status, headers: cached.headers })
    }

    return HttpResponse.json(cached.response, {
      status: cached.status,
      headers: cached.headers,
    })
  }

  async set(
    originalFetch: typeof window.fetch,
    options: { url: string; data: string | Record<string, unknown>; response?: Response },
  ): Promise<void> {
    const { url, data, response } = options
    const status = response?.status
    const headers = response ? response.headers : []

    const res = await originalFetch('/api/__record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        response: data,
        status: status,
        headers: Object.fromEntries(headers.entries()),
      }),
    })
    if (!res.ok) {
      throw new Error(`${response?.status} ${response?.statusText}`)
    } else {
      console.log('✅ Cached:', url)
    }
  }
}
