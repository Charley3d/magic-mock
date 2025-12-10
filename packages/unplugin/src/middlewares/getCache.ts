import { existsSync, readFileSync } from 'fs'
import { type IncomingMessage, type ServerResponse } from 'http'
import path from 'path'
import { type Connect } from 'vite'
import { sendCompressedJson as optimizedSendJson } from '../utils/compressRes'

export const getCache = (
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  cacheDir: string,
) => {
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

    // Check if cache file exists, if not return 404
    if (!existsSync(filepath)) {
      res.writeHead(404)
      res.end()
      return
    }

    const buffer = readFileSync(filepath)

    return optimizedSendJson(req, res, buffer)
  }
}
