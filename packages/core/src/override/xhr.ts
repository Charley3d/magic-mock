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

export function overrideXHR() {
  // Store original methods
  const originalOpen = originalXMLHttpRequest.prototype.open
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
    ;(this as any)._method = method
    ;(this as any)._url = url
    return originalOpen.call(this, method, url, async, user, password)
  }

  // Override send to intercept for both mocking and recording
  originalXMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const xhr = this
    const method = (xhr as any)._method
    const url = (xhr as any)._url

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
          Reflect.defineProperty(xhr, 'responseText', {
            writable: true,
            value: responseText,
          })
          Reflect.defineProperty(xhr, 'response', {
            writable: true,
            value: responseText,
          })
          Reflect.defineProperty(xhr, 'status', { writable: true, value: status })
          Reflect.defineProperty(xhr, 'statusText', { writable: true, value: statusText })
          Reflect.defineProperty(xhr, 'readyState', { writable: true, value: 4 })

          const rsEvent = new Event('readystatechange')

          xhr.dispatchEvent(rsEvent)

          const loadEvent = new ProgressEvent('load', {
            lengthComputable: true,
            loaded: responseText.length,
            total: responseText.length,
          })
          xhr.dispatchEvent(loadEvent)

          // loadend
          const loadEndEvent = new ProgressEvent('loadend', {
            lengthComputable: true,
            loaded: responseText.length,
            total: responseText.length,
          })
          xhr.dispatchEvent(loadEndEvent)
        })
        .catch(() => {
          console.log('❌ XHR Cache miss:', method, url)
          // Cache miss - fall through to real XHR
          sendRealXHR(xhr, method, url, serializedBody, body)
        })

      // Return immediately - we've handled it async
      return
    }

    // Not mocking or not eligible for caching - send real request
    sendRealXHR(xhr, method, url, serializedBody, body)
  }

  // Helper function to send real XHR and record if needed
  function sendRealXHR(
    xhr: XMLHttpRequest,
    method: string,
    url: string | URL,
    serializedBody: string | undefined,
    originalBody?: Document | XMLHttpRequestBodyInit | null,
  ) {
    // Store original onreadystatechange
    const originalOnReadyStateChange = xhr.onreadystatechange

    xhr.onreadystatechange = function () {
      // Call original handler first
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.call(xhr, new Event('readystatechange'))
      }

      // Record response when request is complete
      const safeUrl = getURL(url)
      if (
        xhr.readyState === 4 &&
        isRecording() &&
        isCacheable(safeUrl, method) &&
        xhr.status >= 200 &&
        xhr.status < 300
      ) {
        tryStoreXHRResponse(safeUrl!, xhr, method, serializedBody)
      }
    }

    return originalSend.call(xhr, originalBody)
  }
}

async function tryStoreXHRResponse(url: URL, xhr: XMLHttpRequest, method: string, body?: string) {
  const contentType = xhr.getResponseHeader('content-type')

  let data: string | Record<string, unknown>
  if (contentType?.includes('application/json')) {
    try {
      data = JSON.parse(xhr.responseText)
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
