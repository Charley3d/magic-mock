import { createStore } from '../store'
import {
  getURL,
  isCacheable,
  isMocking,
  isRecording,
  originalFetch,
  originalXMLHttpRequest,
  serializeBody,
} from '../utils'
const store = createStore()

/**
 * Interface for augmented XMLHttpRequest with Magic Mock metadata
 */
interface MagicMockXHR extends XMLHttpRequest {
  _method?: string
  _url?: string | URL
}

export function overrideXHR() {
  // Store original methods

  // eslint-disable-next-line
  const originalOpen = originalXMLHttpRequest.prototype.open
  // eslint-disable-next-line
  const originalSend = originalXMLHttpRequest.prototype.send

  // Override open to capture method and URL
  originalXMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    user?: string | null,
    password?: string | null,
  ) {
    // Store method and URL on the instance for later use in send
    ;(this as MagicMockXHR)._method = method
    ;(this as MagicMockXHR)._url = url
    return originalOpen.call(this, method, url, async, user, password)
  }

  // Override send to intercept for both mocking and recording
  originalXMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const method = (this as MagicMockXHR)._method
    const url = (this as MagicMockXHR)._url

    // If method or URL are not set, fall back to original send
    // This shouldn't happen in practice since open() must be called before send()
    if (!method || !url) {
      return originalSend.call(this, body)
    }

    // Serialize body using shared helper
    const serializedBody = serializeBody(body)

    // Check mock mode FIRST - try to serve from cache
    const safeUrl = getURL(url)
    if (isMocking() && isCacheable(safeUrl, method)) {
      store
        .get(originalFetch, {
          url: safeUrl!.href,
          method,
          body: serializedBody,
        })
        .then(async (cachedResponse) => {
          // Successfully got cached response - synthesize XHR response
          console.log('🔄 Serving XHR from cache:', method, safeUrl!.href)

          const responseText = await cachedResponse.text()
          const status = cachedResponse.status
          const statusText = cachedResponse.statusText

          // Manually set XHR properties to simulate response
          Reflect.defineProperty(this, 'responseText', {
            writable: true,
            value: responseText,
          })
          Reflect.defineProperty(this, 'response', {
            writable: true,
            value: responseText,
          })
          Reflect.defineProperty(this, 'status', { writable: true, value: status })
          Reflect.defineProperty(this, 'statusText', { writable: true, value: statusText })
          Reflect.defineProperty(this, 'readyState', { writable: true, value: 4 })

          const rsEvent = new Event('readystatechange')

          this.dispatchEvent(rsEvent)

          const loadEvent = new ProgressEvent('load', {
            lengthComputable: true,
            loaded: responseText.length,
            total: responseText.length,
          })
          this.dispatchEvent(loadEvent)

          // loadend
          const loadEndEvent = new ProgressEvent('loadend', {
            lengthComputable: true,
            loaded: responseText.length,
            total: responseText.length,
          })
          this.dispatchEvent(loadEndEvent)
        })
        .catch(() => {
          console.log('❌ XHR Cache miss:', method, url)
          // Cache miss - fall through to real XHR
          sendRealXHR(this, method, url, serializedBody, body)
        })

      // Return immediately - we've handled it async
      return
    }

    // Not mocking or not eligible for caching - send real request
    sendRealXHR(this, method, url, serializedBody, body)
  }

  // Helper function to send real XHR and record if needed
  function sendRealXHR(
    xhr: XMLHttpRequest,
    method: string,
    url: string | URL,
    serializedBody: string | undefined,
    originalBody?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const recordingHandler = function () {
      // Record response when request is complete
      const safeUrl = getURL(url)
      console.log(xhr.readyState, isRecording(), isCacheable(safeUrl, method), xhr.status)
      if (
        xhr.readyState === 4 &&
        isRecording() &&
        isCacheable(safeUrl, method) &&
        xhr.status >= 200 &&
        xhr.status < 300
      ) {
        tryStoreXHRResponse(safeUrl!, xhr, method, serializedBody).catch((e: unknown) => {
          console.error(e)
        })
      }
    }

    xhr.addEventListener('loadend', recordingHandler, { once: true })

    return originalSend.call(xhr, originalBody)
  }
}

async function tryStoreXHRResponse(url: URL, xhr: XMLHttpRequest, method: string, body?: string) {
  const contentType = xhr.getResponseHeader('content-type')

  let data: string | Record<string, unknown>
  if (contentType?.includes('application/json')) {
    try {
      data = JSON.parse(xhr.responseText) as Record<string, unknown>
    } catch {
      data = xhr.responseText
    }
  } else {
    data = xhr.responseText
  }

  const headers = new Headers()
  // Copy response headers
  const responseHeaders = xhr.getAllResponseHeaders()
  if (responseHeaders) {
    responseHeaders.split('\r\n').forEach((header) => {
      const [key, value] = header.split(': ')
      if (key && value) {
        headers.set(key, value)
      }
    })
  }

  // Create a mock Response object for storage compatibility
  const mockResponse = new Response(xhr.responseText, {
    status: xhr.status,
    statusText: xhr.statusText,
    headers,
  })
  console.log({
    url: url.href,
    method,
    body,
    data,
    response: mockResponse,
  })
  try {
    await store.set(originalFetch, {
      url: url.href,
      method,
      body,
      data,
      response: mockResponse,
    })
  } catch (e) {
    console.error('Error while storing XHR response', e)
  }
}
