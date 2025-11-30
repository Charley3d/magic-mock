import { http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'
import { LocalStore, RemoteStore } from './store'
import { getURL, isApi, isMedia, isMethodAllowed } from './utils'

declare const __STANDALONE__: boolean
const storage = __STANDALONE__ ? new LocalStore() : new RemoteStore()
const originalFetch = window.fetch
const isRecording = () => localStorage.getItem('msw-recording') === 'true'
const isMocking = () => localStorage.getItem('msw-mocking') === 'true'

export function initMagicMock() {
  // Override fetch for recording
  overrideFetch()
  createWorker()

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButtons)
  } else {
    createButtons()
  }
}

function createWorker() {
  const worker = setupWorker(
    http.get('*', async ({ request }) => {
      const url = getURL(request)

      if (url === null || isMedia(url) || isApi(url)) {
        return passthrough()
      }

      try {
        // Mock mode: serve from cache if available
        return await tryGetFromStore(url)
      } catch (e) {
        console.log('❌ No cache for:', url.href)
        console.log('Missing cache reason:', e)
      }
      return passthrough()
    }),
  )

  // Start worker
  worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

function overrideFetch() {
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const response = await originalFetch(...args)
    if (!isRecording()) {
      return response
    }
    const [input, init] = args
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
    await tryStoreResponse(input, response, method)

    return response
  }
}

async function tryGetFromStore(url: URL) {
  if (!isMocking()) {
    throw new Error('Not in mocking mode')
  }

  return storage.get(originalFetch, {
    url: url.href,
  })
}

async function tryStoreResponse(url: string | Request | URL, response: Response, method: string) {
  // Ensure we get a URL object
  const safeUrl = getURL(url)

  if (
    safeUrl === null ||
    isMedia(safeUrl) ||
    isApi(safeUrl) ||
    !response.ok ||
    !isMethodAllowed(method)
  ) {
    return
  }

  const clone = response.clone()
  const contentType = response.headers.get('content-type')

  let data: string | Record<string, unknown>
  if (contentType?.includes('application/json')) {
    data = await clone.json()
  } else {
    data = await clone.text()
  }

  try {
    storage.set(originalFetch, {
      url: safeUrl.href,
      data,
      response,
    })
  } catch (e) {
    console.error('Error while storing response', e)
  }
}

// Create sticky buttons
function createButtons() {
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 10px; right: 10px; z-index: 99999; display: flex; gap: 10px;'

  const recordBtn = document.createElement('button')
  recordBtn.textContent = isRecording() ? '⏹ Recording...' : '⏺ Record'
  recordBtn.style.cssText = `padding: 10px 15px; background: ${
    isRecording() ? '#ff0000' : '#ff4444'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  const mockBtn = document.createElement('button')
  mockBtn.textContent = isMocking() ? '✓ Mocking' : '🔄 Mock'
  mockBtn.style.cssText = `padding: 10px 15px; background: ${
    isMocking() ? '#0000ff' : '#4444ff'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  recordBtn.onclick = () => {
    const newIsRecording = !isRecording()
    localStorage.setItem('msw-recording', newIsRecording.toString())
    recordBtn.style.background = isRecording() ? '#ff0000' : '#ff4444'
    recordBtn.textContent = isRecording() ? '⏹ Recording...' : '⏺ Record'
    console.log('Recording:', isRecording())
  }

  mockBtn.onclick = () => {
    const newIsMocking = !isMocking()
    localStorage.setItem('msw-mocking', newIsMocking.toString())
    mockBtn.style.background = newIsMocking ? '#0000ff' : '#4444ff'
    mockBtn.textContent = newIsMocking ? '✓ Mocking' : '🔄 Mock'
    console.log('Mocking:', newIsMocking)
  }

  container.appendChild(recordBtn)
  container.appendChild(mockBtn)
  document.body.appendChild(container)
}

if (!__STANDALONE__) {
  initMagicMock()
}
