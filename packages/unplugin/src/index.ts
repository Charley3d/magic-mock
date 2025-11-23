import fs from 'fs'
import path from 'path'
import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import type { ViteDevServer } from 'vite'

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

        const mswSourceLib = path.join(process.cwd(), 'node_modules/msw/lib')

        if (fs.existsSync(mswSourceLib)) {
          fs.cpSync(mswSourceLib, mswLibDir, { recursive: true })
          console.log('✅ MSW lib copied to public/__msw/')
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
                'msw/browser': '/__msw/browser/index.mjs',
                msw: '/__msw/index.mjs',
              },
            }),
            injectTo: 'head',
          },
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: clientScript,
            injectTo: 'head',
          },
        ]
      },
    },

    // Webpack-specific hooks
    webpack(compiler) {
      console.warn('⚠️ Webpack support coming soon for Magic Mock')
      // TODO: Implement webpack dev server middleware
    },
  }
}

export const magicMock = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default magicMock
