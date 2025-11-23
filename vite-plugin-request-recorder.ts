import { build, transformSync } from 'esbuild'
import fs from 'fs'
import path from 'path'
import { type Plugin } from 'vite'

export function requestRecorderPlugin(): Plugin {
  const cacheDir = path.join(process.cwd(), '.request-cache')
  const publicDir = path.join(process.cwd(), 'public')
  const mswLibDir = path.join(publicDir, '__msw')

  return {
    name: 'vite-plugin-request-recorder',

    async buildStart() {
      if (!fs.existsSync(mswLibDir)) {
        fs.mkdirSync(mswLibDir, { recursive: true })
      }

      // Create a unified entry point
      const unifiedEntry = path.join(mswLibDir, '_unified-entry.js')
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
          sourcemap: true,
          minify: false,
        })

        // Clean up temp file
        fs.unlinkSync(unifiedEntry)

        console.log('✅ MSW bundled')
      } catch (error) {
        console.error('❌ Failed to bundle MSW:', error)
        throw error
      }
    },

    configureServer(server) {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      server.middlewares.use('/api/__record', async (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => (body += chunk))
          req.on('end', () => {
            const { url, response, status, headers } = JSON.parse(body)
            const filename = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_') + '.json'
            const filepath = path.join(cacheDir, filename)

            fs.writeFileSync(filepath, JSON.stringify({ url, response, status, headers }, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          })
        }
      })

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
      // Read and compile TypeScript client script
      const clientScriptPath = path.join(__dirname, 'client-script.ts')
      const clientScriptTs = fs.readFileSync(clientScriptPath, 'utf-8')

      // Compile TS → JS with esbuild
      const clientScript = transformSync(clientScriptTs, {
        loader: 'ts',
        format: 'esm',
        target: 'es2020',
      }).code

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
  }
}
