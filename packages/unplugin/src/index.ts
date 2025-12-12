import { type MagicMockOptions } from '@magicmock/core'
import fs from 'fs'
import path from 'path'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ViteDevServer } from 'vite'
import { getCache, setCache } from './middlewares/cache'
import { configurationToInject, injectScripts, magicMockCoreToInject } from './middlewares/inject'
import { getHtmlWebpackPlugins, registerHtmlWebpackPluginHooks } from './middlewares/webpack'

function createCacheDir(cacheDir: string) {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
}

const unpluginFactory: UnpluginFactory<MagicMockOptions | undefined> = (options = {}) => {
  const cacheDir = path.join(process.cwd(), options.cacheDir || '.request-cache')

  const apiPrefix = options?.endpoints?.apiPrefix || '/api'
  const setCachePath = options?.endpoints?.setCachePath || '/set-cache'
  const getCachePath = options?.endpoints?.getCachePath || '/get-cache'

  const setCacheEndpoint = `${apiPrefix}${setCachePath}`
  const getCacheEndpoint = `${apiPrefix}${getCachePath}`

  return {
    name: 'magic-mock',

    // Vite-specific hooks
    vite: {
      buildStart() {
        // Ensure cache directory exists
        createCacheDir(cacheDir)
        console.log('✅ Magic Mock initialized - cache dir:', cacheDir)
      },
      configureServer(server: ViteDevServer) {
        // Endpoint to record requests
        server.middlewares.use(setCacheEndpoint, (req, res) => setCache(req, res, cacheDir))
        // Endpoint to get cached requests
        server.middlewares.use(getCacheEndpoint, (req, res) => getCache(req, res, cacheDir))
      },
      transformIndexHtml() {
        // Read the compiled client script from core package
        const clientScript = magicMockCoreToInject()

        if (!clientScript) {
          return []
        }

        return (
          injectScripts(
            [
              { content: configurationToInject(apiPrefix, getCachePath, setCachePath) },
              { content: clientScript, type: 'module' },
            ],
            'vite',
          ) ?? []
        )
      },
    },

    // Webpack-specific hooks
    webpack(compiler) {
      console.log('🚀 Magic Mock Webpack plugin loaded!')
      createCacheDir(cacheDir)
      // Ensure cache directory exists
      compiler.hooks.beforeRun.tapAsync('magic-mock', (_, callback) => {
        console.log('✅ Magic Mock initialized - cache dir:', cacheDir)
        callback()
      })

      // Inject script into HTML
      try {
        compiler.hooks.compilation.tap('magic-mock', (compilation) => {
          const htmlPlugins = getHtmlWebpackPlugins(compilation)

          if (htmlPlugins.length === 0) {
            console.warn('[magic-mock] No HtmlWebpackPlugin found, skipping HTML hooks')
            return
          }

          registerHtmlWebpackPluginHooks(htmlPlugins, compilation, {
            apiPrefix,
            getCachePath,
            setCachePath,
          })
        })
      } catch (error) {
        console.error('❌ Failed to inject scripts:', error)
      }
    },
  }
}

export const magicMock = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default magicMock
