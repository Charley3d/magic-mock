import { MagicMockEndpointPaths } from '../types'
import { GLOBAL_CONFIG_KEY } from './const'

const DEFAULT_ENDPOINTS: MagicMockEndpointPaths = {
  apiPrefix: '/__magic-mock',
  getCachePath: '/__get-cache',
  setCachePath: '/__set-cache',
}

/**
 * Gets the endpoint configuration for Magic Mock.
 *
 * The configuration is typically injected by the Magic Mock plugin via a
 * <script> tag. If the plugin hasn't run yet, this function will initialize
 * the global config with default values.
 *
 * Note: This function has a side effect - it can write to window[GLOBAL_CONFIG_KEY]
 *
 * @returns The endpoint configuration
 */
export function getEndpointConfig(): MagicMockEndpointPaths {
  if (!window[GLOBAL_CONFIG_KEY]) {
    window[GLOBAL_CONFIG_KEY] = DEFAULT_ENDPOINTS
  }
  return window[GLOBAL_CONFIG_KEY]
}
