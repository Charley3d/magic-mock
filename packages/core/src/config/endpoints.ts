import { MagicMockConfig } from '../types'

// Helper function
export function getConfig(): MagicMockConfig {
  return (
    window.__MAGIC_MOCK_CONFIG__ ?? {
      apiPrefix: '/__magic-mock',
      getCachePath: '/__get-cache',
      setCachePath: '/__set-cache',
    }
  )
}
