const MagicMock = require('@magicmock/unplugin/webpack')
const { defineConfig } = require('@vue/cli-service')
const fs = require('fs')
const path = require('path')

const apiPrefix = '/chamagic'
const getCachePath = '/get-mock'
const setCachePath = '/set-mock'

const getCacheEndpoint = `${apiPrefix}${getCachePath}`
const setCacheEndpoint = `${apiPrefix}${setCachePath}`

module.exports = defineConfig({
  transpileDependencies: true,

  configureWebpack: {
    plugins: [
      MagicMock({
        endpoints: {
          apiPrefix,
          getCachePath,
          setCachePath,
        },
      }),
    ],
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }

      const cacheDir = path.join(process.cwd(), '.request-cache')

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      // Record endpoint
      devServer.app.post(setCacheEndpoint, (req, res) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const { url, response, status, headers } = JSON.parse(body)
            const filename = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_') + '.json'
            const filepath = path.join(cacheDir, filename)

            fs.writeFileSync(filepath, JSON.stringify({ url, response, status, headers }, null, 2))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } catch (error) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: 'Failed to save' }))
          }
        })
      })

      // Get cache endpoint
      devServer.app.get(getCacheEndpoint, (req, res) => {
        const url = req.query.url
        if (!url) {
          res.writeHead(400)
          res.end()
          return
        }

        const decodedUrl = decodeURIComponent(url)
        const filename = Buffer.from(decodedUrl).toString('base64').replace(/[/+=]/g, '_') + '.json'
        const filepath = path.join(cacheDir, filename)

        if (fs.existsSync(filepath)) {
          const cached = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(cached))
        } else {
          res.writeHead(404)
          res.end()
        }
      })

      return middlewares
    },
  },
})
