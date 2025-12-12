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
   * Simulated upload speed for file uploads in bytes/second
   * Used to calculate fake delays when mocking file uploads
   * @default 1048576 (1MB/s)
   */
  uploadSpeed?: number
  endpoints?: MagicMockEndpointPaths
}

export type RecordingMode = 'recording' | 'mocking' | 'off'
export interface CacheRecord {
  url: string
  method: string
  body?: string
  response: string | Record<string, unknown>
  status: number | undefined
  headers: Record<string, string>
}

export interface StoredMedia {
  _file: boolean
  name: string
  size: number
  type: string
}

export interface MagicMockEndpointPaths {
  apiPrefix: string
  getCachePath: string
  setCachePath: string
}

declare global {
  interface Window {
    __MAGIC_MOCK_CONFIG__?: MagicMockEndpointPaths
  }
}
