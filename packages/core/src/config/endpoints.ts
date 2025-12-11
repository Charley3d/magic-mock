import { MagicMockEndpointPaths } from '../types'
import { GLOBAL_CONFIG_KEY } from './const'

export function getConfig(): MagicMockEndpointPaths {
  return (
    window[GLOBAL_CONFIG_KEY] ?? {
      apiPrefix: '/__magic-mock',
      getCachePath: '/__get-cache',
      setCachePath: '/__set-cache',
    }
  )
}
