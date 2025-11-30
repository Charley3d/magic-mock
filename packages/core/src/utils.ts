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

export const isMedia = (request: Request) => {
  const url = new URL(request.url)
  return /\.(jpe?g|png|gif|svg|webp|ico|mp4|mp3|woff2?|ttf|css)$/i.test(url.pathname)
}

export const isApi = (request: Request) => {
  return new URL(request.url).pathname.includes('/api/__')
}
