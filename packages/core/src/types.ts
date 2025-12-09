/**
 * Cached request data structure
 */
export interface CachedRequest {
  url: string
  method: string
  body?: string
  response: unknown
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

  /**
   * Size limit for standalone (LocalStore) caching in bytes
   * @default 50000 (50KB)
   * Set to 0 for no limit
   */
  standaloneSizeLimit?: number

  /**
   * Size limit for unplugin (RemoteStore) caching in bytes
   * @default 1000000 (1MB)
   * Set to 0 for no limit
   */
  unpluginSizeLimit?: number

  /**
   * Simulated upload speed for file uploads in bytes/second
   * Used to calculate fake delays when mocking file uploads
   * @default 1048576 (1MB/s)
   */
  uploadSpeed?: number
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
