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
