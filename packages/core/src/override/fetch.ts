import { createStore } from '../store'
import { getURL, isCacheable, isMocking, isRecording, originalFetch, serializeBody } from '../utils'

const store = createStore()

export function overrideFetch() {
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const [input, init] = args
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')

    // Extract and serialize body if present
    // Note: Document is not included here because fetch() doesn't support Document body in practice
    // (only XHR does). While theoretically possible, it's never used in real-world fetch() calls.
    let body: string | undefined
    if (init?.body) {
      body = serializeBody(init.body)
    } else if (input instanceof Request && input.body) {
      body = serializeBody(await input.clone().text())
    }

    // Check mock mode FIRST - try to serve from cache
    const url = getURL(input)
    const cachedResponse = await tryGetCachedResponse(url, method, body)
    if (cachedResponse) {
      return cachedResponse
    }

    // Make real request
    const response = await originalFetch(...args)

    // Record if needed
    if (isRecording() && url && isCacheable(url, method) && response.ok) {
      await tryStoreResponse(url, response, method, body)
    }

    return response
  }
}

/**
 * Shared helper: Try to get cached response in mock mode
 * Returns Response if cache hit, null if cache miss or not eligible
 */
async function tryGetCachedResponse(
  url: URL | null,
  method: string,
  body?: string,
): Promise<Response | null> {
  if (!isMocking() || !isCacheable(url, method)) {
    return null
  }

  try {
    return await store.get(originalFetch, {
      url: url!.href,
      method,
      body,
    })
  } catch {
    console.log('❌ Cache miss:', method, url!.href)
    return null
  }
}

async function tryStoreResponse(url: URL, response: Response, method: string, body?: string) {
  const clone = response.clone()
  const contentType = response.headers.get('content-type')

  let data: string | Record<string, unknown>
  if (contentType?.includes('application/json')) {
    data = (await clone.json()) as Record<string, unknown>
  } else {
    data = await clone.text()
  }

  try {
    await store.set(originalFetch, {
      url: url.href,
      method,
      body,
      data,
      response,
    })
  } catch (e) {
    console.error('Error while storing response', e)
  }
}
