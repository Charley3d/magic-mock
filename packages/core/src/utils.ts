/**
 * Encode URL to safe filename
 */
export function urlToFilename(url: string): string {
  return Buffer.from(url).toString('base64').replace(/[/+=]/g, '_') + '.json'
}

/**
 * Decode filename back to URL
 */
export function filenameToUrl(filename: string): string {
  const base64 = filename.replace('.json', '').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export const isMedia = (url: URL) => {
  return /\.(jpe?g|png|gif|svg|webp|ico|mp4|mp3|woff2?|ttf|css|js)$/i.test(url.pathname)
}

export const isApi = (url: URL) => {
  return url.pathname.includes('/api/__')
}

export const getURL = (input: string | URL | Request): URL | null => {
  try {
    if (typeof input === 'string') return new URL(input)
    if (input instanceof URL) return input
    if (input instanceof Request) return new URL(input.url)
    return null
  } catch {
    return null
  }
}

export const isMethodAllowed = (method: string) => {
  const allowedMethods = ['GET']
  return allowedMethods.includes(method.toUpperCase())
}
