export interface Store {
  set(
    originalFetch: typeof window.fetch,
    options: { url: string; data: string | Record<string, unknown> },
    response?: Response,
  ): Promise<void>
}

export class RemoteRecorder implements Store {
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

export class LocalRecorder implements Store {
  async set(
    _: typeof window.fetch,
    options: { url: string; data: string | Record<string, unknown>; response?: Response },
  ): Promise<void> {
    const { url, data } = options

    localStorage.setItem(url, JSON.stringify({ url, response: data }))

    console.log('✅ Cached with Local Storage:', url)
  }
}
