import { writeFileSync } from 'fs'
import { type IncomingMessage, type ServerResponse } from 'http'
import path from 'path'
import { type Connect } from 'vite'

export const setCache = (
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  cacheDir: string,
) => {
  if (req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      const {
        url,
        method,
        body: requestBody,
        response,
        status,
        headers,
      } = JSON.parse(body) as Record<string, unknown> //TODO: Create a dedicated interface

      // Generate filename based on method + URL + body
      const cacheKey = `${method as string}:${url as string}${requestBody ? ':' + (requestBody as string) : ''}`
      const filename = Buffer.from(cacheKey).toString('base64').replace(/[/+=]/g, '_') + '.json'
      const filepath = path.join(cacheDir, filename)

      writeFileSync(
        filepath,
        JSON.stringify({ url, method, body: requestBody, response, status, headers }, null, 2),
      )
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    })
  }
}
