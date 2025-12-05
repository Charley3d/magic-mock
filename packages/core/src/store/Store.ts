export interface Store {
  set(
    originalFetch: typeof window.fetch,
    options: {
      url: string
      method: string
      body?: string
      data: string | Record<string, unknown>
      response?: Response
    },
    response?: Response,
  ): Promise<void>

  get(
    originalFetch: typeof window.fetch,
    options: {
      url: string
      method: string
      body?: string
    },
  ): Promise<Response>
}
