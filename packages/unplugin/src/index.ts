import { type MagicMockEndpointPaths, type MagicMockOptions } from '@magicmock/core'
import { GLOBAL_CONFIG_KEY } from '@magicmock/core/config'
import fs from 'fs'
import type HtmlWebpackPlugin from 'html-webpack-plugin'
import { createRequire } from 'node:module'
import path from 'path'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ViteDevServer } from 'vite'
import { Compilation } from 'webpack'
import { getCache } from './middlewares/getCache'
import { setCache } from './middlewares/setCache'

const require = createRequire(import.meta.url)

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
        // Ensure cache directory exists
        createCacheDir(cacheDir)
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

        return [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: clientScript,
            injectTo: 'head-prepend',
          },
          {
            tag: 'script',
            children: configurationToInject(apiPrefix, getCachePath, setCachePath),
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
        createCacheDir(cacheDir)
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

function registerHtmlWebpackPluginHooks(
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
        injectScripts(data, [
          { content: configurationToInject(apiPrefix, getCachePath, setCachePath) },
          { content: clientScript, type: 'module' },
        ])
      }

      cb(null, data)
    })
  })
}

function getHtmlWebpackPlugins(compilation: Compilation) {
  return (
    compilation.compiler.options.plugins?.filter(
      (p) => p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin',
    ) || []
  )
}

function injectScripts(
  data: {
    assetTags: {
      scripts: HtmlWebpackPlugin.HtmlTagObject[]
      styles: HtmlWebpackPlugin.HtmlTagObject[]
      meta: HtmlWebpackPlugin.HtmlTagObject[]
    }
    publicPath: string
    outputName: string
    plugin: HtmlWebpackPlugin
  },
  scripts: { content: string; type?: string }[],
) {
  for (const script of scripts) {
    data.assetTags.scripts.push({
      tagName: 'script',
      voidTag: false,
      attributes: { type: script.type || 'text/javascript' },
      innerHTML: script.content,
      meta: {},
    })
  }
  console.log('✅ Scripts injected!')
  // data.assetTags.scripts.push({
  //   tagName: 'script',
  //   voidTag: false,
  //   attributes: { type: 'text/javascript' },
  //   innerHTML: configurationToInject(apiPrefix, getCachePath, setCachePath),
  //   meta: {},
  // })
  // data.assetTags.scripts.push({
  //   tagName: 'script',
  //   voidTag: false,
  //   attributes: { type: 'module' },
  //   innerHTML: clientScript,
  //   meta: {},
  // })
}
function magicMockCoreToInject() {
  const clientScriptPath = require.resolve('@magicmock/core/client')

  if (!fs.existsSync(clientScriptPath)) {
    console.warn('⚠️ Client script not found. Make sure @magicmock/core is built first.')
    console.warn('   Expected:', clientScriptPath)
    return null
  }

  return fs.readFileSync(clientScriptPath, 'utf-8')
}

function configurationToInject(apiPrefix: string, getCachePath: string, setCachePath: string) {
  return `window["${GLOBAL_CONFIG_KEY}"] = ${JSON.stringify({
    apiPrefix,
    getCachePath,
    setCachePath,
  } as MagicMockEndpointPaths)}`
}
