import type { IncomingMessage, ServerResponse } from 'node:http'
import { gzipSync } from 'node:zlib'

export function sendCompressedJson(req: IncomingMessage, res: ServerResponse, data: Buffer) {
  const rawThreshold = 1024 * 10
  const cached = JSON.parse(data.toString('utf-8')) as Record<string, unknown>
  const statusCode = (cached.status as number) || 200
  const body = JSON.stringify(cached) // compact JSON
  const encodingHeader = (req.headers['accept-encoding'] || '')
  const acceptEncodings = /\bgzip\b/.test(encodingHeader)
  const byteLength = Buffer.byteLength(body)

  // Always vary on encoding so caches behave correctly
  res.setHeader('Vary', 'Accept-Encoding')
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (byteLength > rawThreshold && acceptEncodings) {
    const compressed = gzipSync(body)
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Content-Length', String(compressed.length))
    return res.end(compressed)
  }

  // No compression supported → send plain JSON
  res.setHeader('Content-Length', String(byteLength))
  return res.end(body)
}
