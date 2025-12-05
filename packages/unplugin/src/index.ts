import fs from 'fs'
import type HtmlWebpackPlugin from 'html-webpack-plugin'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ViteDevServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
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
}

const unpluginFactory: UnpluginFactory<MagicMockOptions | undefined> = (options = {}) => {
  const cacheDir = path.join(process.cwd(), options.cacheDir || '.request-cache')

  return {
    name: 'magic-mock',

    // Vite-specific hooks
    vite: {
      async buildStart() {
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
        server.middlewares.use('/api/__record', async (req, res) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => (body += chunk))
            req.on('end', () => {
              const { url, method, body: requestBody, response, status, headers } = JSON.parse(body)

              // Generate filename based on method + URL + body
              const cacheKey = `${method}:${url}${requestBody ? ':' + requestBody : ''}`
              const filename = Buffer.from(cacheKey).toString('base64').replace(/[/+=]/g, '_') + '.json'
              const filepath = path.join(cacheDir, filename)

              fs.writeFileSync(
                filepath,
                JSON.stringify({ url, method, body: requestBody, response, status, headers }, null, 2),
              )
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true }))
            })
          }
        })

        // Endpoint to get cached requests
        server.middlewares.use('/api/__get-cache', (req, res) => {
          if (req.method === 'GET') {
            const urlObj = new URL(req.url || '', `http://${req.headers.host}`)
            const url = urlObj.searchParams.get('url')
            const method = urlObj.searchParams.get('method')
            const body = urlObj.searchParams.get('body')

            if (!url || !method) {
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'Missing url or method parameter' }))
              return
            }

            // Generate filename based on method + URL + body (same as recording)
            const cacheKey = `${method}:${url}${body ? ':' + body : ''}`
            const filename = Buffer.from(cacheKey).toString('base64').replace(/[/+=]/g, '_') + '.json'
            const filepath = path.join(cacheDir, filename)

            if (fs.existsSync(filepath)) {
              const cached = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(cached))
            } else {
              res.writeHead(404)
              res.end()
            }
          }
        })
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
        ]
      },
    },

    // Webpack-specific hooks
    webpack(compiler) {
      console.log('🚀 Magic Mock Webpack plugin loaded!')

      // Ensure cache directory exists
      compiler.hooks.beforeRun.tapAsync('magic-mock', (compilation, callback) => {
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
