import { http, HttpResponse, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'

// Load state from localStorage to persist across page navigations
let isRecording = localStorage.getItem('msw-recording') === 'true'
let isMocking = localStorage.getItem('msw-mocking') === 'true'

const originalFetch = window.fetch

const worker = setupWorker(
  http.get(/^(?!.*\/(api\/__)).*$/, async ({ request }) => {
    const url = request.url
    // Mock mode: serve from cache if available
    if (isMocking) {
      try {
        const cacheResponse = await originalFetch('/api/__get-cache?url=' + encodeURIComponent(url))
        if (cacheResponse.ok) {
          const cached = await cacheResponse.json()
          console.log('🔄 Serving from cache:', url)
          return HttpResponse.json(cached.response, {
            status: cached.status,
            headers: cached.headers,
          })
        }
      } catch (e) {
        console.log('❌ No cache for:', url)
      }
    }

    return passthrough()
  }),
)

// Start worker if needed
if (isRecording || isMocking) {
  worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

// Override fetch for recording (lighter than MSW bypass)
window.fetch = async function (...args: Parameters<typeof fetch>) {
  const response = await originalFetch(...args)
  if (!isRecording) {
    return response
  }
  const [url] = args

  if (typeof url === 'string' && !url.includes('/api/__') && response.ok) {
    const clone = response.clone()
    const contentType = response.headers.get('content-type')

    let data: any
    if (contentType?.includes('application/json')) {
      data = await clone.json()
    } else {
      data = await clone.text()
    }

    originalFetch('/api/__record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        response: data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      }),
    }).then(() => console.log('✅ Cached:', url))
  }

  return response
}

// Create sticky buttons
function createButtons() {
  const container = document.createElement('div')
  container.style.cssText =
    'position: fixed; top: 10px; right: 10px; z-index: 99999; display: flex; gap: 10px;'

  const recordBtn = document.createElement('button')
  recordBtn.textContent = isRecording ? '⏹ Recording...' : '⏺ Record'
  recordBtn.style.cssText = `padding: 10px 15px; background: ${
    isRecording ? '#ff0000' : '#ff4444'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  const mockBtn = document.createElement('button')
  mockBtn.textContent = isMocking ? '✓ Mocking' : '🔄 Mock'
  mockBtn.style.cssText = `padding: 10px 15px; background: ${
    isMocking ? '#0000ff' : '#4444ff'
  }; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`

  recordBtn.onclick = () => {
    isRecording = !isRecording
    localStorage.setItem('msw-recording', isRecording.toString())
    recordBtn.style.background = isRecording ? '#ff0000' : '#ff4444'
    recordBtn.textContent = isRecording ? '⏹ Recording...' : '⏺ Record'
    console.log('Recording:', isRecording)
  }

  mockBtn.onclick = () => {
    isMocking = !isMocking
    localStorage.setItem('msw-mocking', isMocking.toString())
    mockBtn.style.background = isMocking ? '#0000ff' : '#4444ff'
    mockBtn.textContent = isMocking ? '✓ Mocking' : '🔄 Mock'
    console.log('Mocking:', isMocking)
  }

  container.appendChild(recordBtn)
  container.appendChild(mockBtn)
  document.body.appendChild(container)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButtons)
} else {
  createButtons()
}

export type RecordingMode = 'recording' | 'mocking' | 'off'
