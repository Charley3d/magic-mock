import { build } from 'esbuild'
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
  const publicDir = path.join(process.cwd(), 'public')
  const mswLibDir = path.join(publicDir, '__msw')

  return {
    name: 'magic-mock',

    // Vite-specific hooks
    vite: {
      async buildStart() {
        // Copy MSW browser bundle
        if (!fs.existsSync(mswLibDir)) {
          fs.mkdirSync(mswLibDir, { recursive: true })
        }

        const unifiedEntry = path.join(__dirname, '_unified-entry.js')
        fs.writeFileSync(
          unifiedEntry,
          `
          export { http, HttpResponse, passthrough } from 'msw'
          export { setupWorker } from 'msw/browser'
        `,
        )

        try {
          await build({
            entryPoints: [unifiedEntry],
            bundle: true,
            format: 'esm',
            outfile: path.join(mswLibDir, 'msw-bundle.js'),
            platform: 'browser',
            target: 'es2020',
            minify: false,
            sourcemap: true,
          })
          fs.unlinkSync(unifiedEntry)

          console.log('✅ MSW bundled to public/__msw/msw-bundle.js')

          const mswServiceWorkerSource = require.resolve('msw/mockServiceWorker.js')
          const mswServiceWorkerDest = path.join(publicDir, 'mockServiceWorker.js')

          if (fs.existsSync(mswServiceWorkerSource)) {
            fs.copyFileSync(mswServiceWorkerSource, mswServiceWorkerDest)
            console.log('✅ MSW Service Worker copied to public/')
          } else {
            console.warn('⚠️ MSW Service Worker not found. Install msw: npm install msw')
          }
        } catch (error) {
          console.error('❌ Failed to bundle MSW:', error)
          if (fs.existsSync(unifiedEntry)) {
            fs.unlinkSync(unifiedEntry)
          }
        }
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
              const { url, response, status, headers } = JSON.parse(body)
              const filename = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_') + '.json'
              const filepath = path.join(cacheDir, filename)

              fs.writeFileSync(
                filepath,
                JSON.stringify({ url, response, status, headers }, null, 2),
              )
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true }))
            })
          }
        })

        // Endpoint to get cached requests
        server.middlewares.use('/api/__get-cache', (req, res) => {
          if (req.method === 'GET') {
            const url = req.url?.split('?url=')[1]
            if (!url) {
              res.writeHead(400)
              res.end()
              return
            }

            const decodedUrl = decodeURIComponent(url)
            const filename =
              Buffer.from(decodedUrl).toString('base64').replace(/[/+=]/g, '_') + '.json'
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
        const clientScriptPath = path.resolve(__dirname, '../../core/dist/client-script.js')

        if (!fs.existsSync(clientScriptPath)) {
          console.warn('⚠️ Client script not found. Make sure @magicmock/core is built first.')
          console.warn('   Expected:', clientScriptPath)
          return []
        }

        const clientScript = fs.readFileSync(clientScriptPath, 'utf-8')

        return [
          {
            tag: 'script',
            attrs: { type: 'importmap' },
            children: JSON.stringify({
              imports: {
                'msw/browser': '/__msw/msw-bundle.js',
                msw: '/__msw/msw-bundle.js',
              },
            }),
            injectTo: 'head-prepend',
          },
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

      const setupMSW = async () => {
        console.log('📦 Setting up MSW...')
        const corePath = path.join(__dirname, '../../core')
        const publicDir = path.join(compiler.options.context || process.cwd(), 'public')
        const mswLibDir = path.join(publicDir, '__msw')

        if (!fs.existsSync(mswLibDir)) {
          fs.mkdirSync(mswLibDir, { recursive: true })
        }

        // Copy Service Worker
        const mswServiceWorkerSource = path.join(
          corePath,
          'node_modules/msw/lib/mockServiceWorker.js',
        )
        const mswServiceWorkerDest = path.join(publicDir, 'mockServiceWorker.js')

        if (fs.existsSync(mswServiceWorkerSource)) {
          fs.copyFileSync(mswServiceWorkerSource, mswServiceWorkerDest)
          console.log('✅ MSW Service Worker copied to public/')
        }

        // Bundle MSW
        const unifiedEntry = path.join(corePath, '_unified-entry.js')
        fs.writeFileSync(
          unifiedEntry,
          `
      export * from 'msw'
      export * from 'msw/browser'
    `,
        )

        try {
          await build({
            entryPoints: [unifiedEntry],
            bundle: true,
            format: 'esm',
            outfile: path.join(mswLibDir, 'msw-bundle.js'),
            platform: 'browser',
            target: 'es2020',
            minify: false,
            sourcemap: true,
          })
          fs.unlinkSync(unifiedEntry)
          console.log('✅ MSW bundled for Webpack')
        } catch (error) {
          console.error('❌ Failed to bundle MSW:', error)
          if (fs.existsSync(unifiedEntry)) {
            fs.unlinkSync(unifiedEntry)
          }
        }
        console.log('✅ MSW setup complete')
      }

      compiler.hooks.beforeRun.tapPromise('magic-mock', async () => {
        console.log('🔥 beforeRun hook triggered')
        await setupMSW()
      })

      compiler.hooks.watchRun.tapPromise('magic-mock', async () => {
        console.log('👀 watchRun hook triggered')
        await setupMSW()
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
              const clientScriptPath = path.resolve(__dirname, '../../core/dist/client-script.js')

              if (!fs.existsSync(clientScriptPath)) {
                console.warn('⚠️ Client script NOT found at:', clientScriptPath)
                return cb(null, data)
              }

              const clientScript = fs.readFileSync(clientScriptPath, 'utf-8')

              if (data.assetTags) {
                data.assetTags.scripts.push(
                  {
                    tagName: 'script',
                    voidTag: false,
                    attributes: { type: 'importmap' },
                    innerHTML: JSON.stringify({
                      imports: {
                        'msw/browser': '/__msw/msw-bundle.js',
                        msw: '/__msw/msw-bundle.js',
                      },
                    }),
                    meta: {},
                  },
                  {
                    tagName: 'script',
                    voidTag: false,
                    attributes: { type: 'module' },
                    innerHTML: clientScript,
                    meta: {},
                  },
                )
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
