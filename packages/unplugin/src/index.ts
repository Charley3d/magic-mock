import { MagicMockConfig } from '@magicmock/core'
import fs from 'fs'
import type HtmlWebpackPlugin from 'html-webpack-plugin'
import { createRequire } from 'node:module'
import path from 'path'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ViteDevServer } from 'vite'
import { getCache } from './middlewares/getCache'
import { setCache } from './middlewares/setCache'

const require = createRequire(import.meta.url)

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

  endpoints?: MagicMockConfig
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
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        console.log('✅ Magic Mock initialized - cache dir:', cacheDir)
      },

      configureServer(server: ViteDevServer) {
        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        // Endpoint to record requests
        server.middlewares.use(setCacheEndpoint, (req, res) => setCache(req, res, cacheDir))
        // Endpoint to get cached requests
        server.middlewares.use(getCacheEndpoint, (req, res) => getCache(req, res, cacheDir))
      },

      transformIndexHtml() {
        // Read the compiled client script from core package
        const clientScriptPath = require.resolve('@magicmock/core/client')

        if (!fs.existsSync(clientScriptPath)) {
          console.warn('⚠️ Client script not found. Make sure @magicmock/core is built first.')
          console.warn('   Expected:', clientScriptPath)
          return []
        }

        const clientScript = fs.readFileSync(clientScriptPath, 'utf-8')

        return [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: clientScript,
            injectTo: 'head-prepend',
          },
          {
            tag: 'script',
            children: `window.__MAGIC_MOCK_CONFIG__ = {
            apiPrefix: "${apiPrefix}",
            getCachePath: "${getCachePath}",
            setCachePath: "${setCachePath}",
            };`,
            injectTo: 'head-prepend',
          },
        ]
      },
    },

    // Webpack-specific hooks
    webpack(compiler) {
      console.log('🚀 Magic Mock Webpack plugin loaded!')

      // Ensure cache directory exists
      compiler.hooks.beforeRun.tapAsync('magic-mock', (_, callback) => {
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true })
        }
        console.log('✅ Magic Mock initialized - cache dir:', cacheDir)
        callback()
      })
      // Inject script into HTML
      try {
        compiler.hooks.compilation.tap('magic-mock', (compilation) => {
          const htmlPlugins =
            compilation.compiler.options.plugins?.filter(
              (p) => p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin',
            ) || []

          if (htmlPlugins.length === 0) {
            console.warn('[magic-mock] No HtmlWebpackPlugin found, skipping HTML hooks')
            return
          }

          htmlPlugins.forEach((htmlPlugin) => {
            const hooks = (htmlPlugin.constructor as typeof HtmlWebpackPlugin).getHooks(compilation)

            hooks.alterAssetTags.tapAsync('magic-mock', (data, cb) => {
              const clientScriptPath = require.resolve('@magicmock/core/client')

              if (!fs.existsSync(clientScriptPath)) {
                console.warn('⚠️ Client script NOT found at:', clientScriptPath)
                return cb(null, data)
              }

              const clientScript = fs.readFileSync(clientScriptPath, 'utf-8')

              if (data.assetTags) {
                data.assetTags.scripts.push({
                  tagName: 'script',
                  voidTag: false,
                  attributes: { type: 'module' },
                  innerHTML: clientScript,
                  meta: {},
                })
              }

              console.log('✅ Scripts injected!')
              cb(null, data)
            })
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
