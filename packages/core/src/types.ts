/**
 * Cached request data structure
 */
export interface CachedRequest {
  url: string
  response: any
  status: number
  headers: Record<string, string>
}

/**
 * Magic Mock configuration options
 */
export interface MagicMockOptions {
  /**
   * Cache directory path
   * @default '.request-cache'
   */
  cacheDir?: string

  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled?: boolean
}

export type RecordingMode = 'recording' | 'mocking' | 'off'
