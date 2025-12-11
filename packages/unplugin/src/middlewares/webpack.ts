import { MagicMockEndpointPaths, MagicMockOptions } from '@magicmock/core'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import { Compilation } from 'webpack'
import { getCache, setCache } from './cache'
import { configurationToInject, injectScripts, magicMockCoreToInject } from './inject'

export function registerHtmlWebpackPluginHooks(
  htmlPlugins: ReturnType<typeof getHtmlWebpackPlugins>,
  compilation: Compilation,
  endpoints: MagicMockEndpointPaths,
) {
  const { apiPrefix, getCachePath, setCachePath } = endpoints
  htmlPlugins.forEach((htmlPlugin) => {
    const hooks = (htmlPlugin.constructor as typeof HtmlWebpackPlugin).getHooks(compilation)

    hooks.alterAssetTags.tapAsync('magic-mock', (data, cb) => {
      const clientScript = magicMockCoreToInject()

      if (!clientScript) {
        return cb(null, data)
      }

      if (data.assetTags) {
        data.assetTags.scripts = data.assetTags.scripts.concat(
          injectScripts(
            [
              { content: configurationToInject(apiPrefix, getCachePath, setCachePath) },
              { content: clientScript, type: 'module' },
            ],
            'webpack',
          ),
        )
      }

      cb(null, data)
    })
  })
}

export function getHtmlWebpackPlugins(compilation: Compilation) {
  return (
    compilation.compiler.options.plugins?.filter(
      (p) => p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin',
    ) || []
  )
}

export function createDevServerConfig(options: MagicMockOptions = {}) {
  const cacheDir = path.join(process.cwd(), options.cacheDir || '.request-cache')
  const apiPrefix = options?.endpoints?.apiPrefix || '/api'
  const setCachePath = options?.endpoints?.setCachePath || '/set-cache'
  const getCachePath = options?.endpoints?.getCachePath || '/get-cache'

  const setCacheEndpoint = `${apiPrefix}${setCachePath}`
  const getCacheEndpoint = `${apiPrefix}${getCachePath}`

  return function setupMagicMockEndpoints(devServer: any) {
    console.log(setCacheEndpoint)
    devServer.app.post(setCacheEndpoint, (req: any, res: any) => setCache(req, res, cacheDir))
    devServer.app.get(getCacheEndpoint, (req: any, res: any) => getCache(req, res, cacheDir))
  }
}
