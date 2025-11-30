import { DefaultBodyType, HttpResponse, JsonBodyType } from 'msw'

export interface Store {
  set(
    originalFetch: typeof window.fetch,
    options: { url: string; data: string | Record<string, unknown> },
    response?: Response,
  ): Promise<void>

  get(
    originalFetch: typeof window.fetch,
    options: { url: string },
  ): Promise<HttpResponse<JsonBodyType> | HttpResponse<DefaultBodyType>>
}
