import { MagicMockEndpointPaths } from '@magicmock/core'
import { GLOBAL_CONFIG_KEY } from '@magicmock/core/config'
import { existsSync, readFileSync } from 'fs'
import { Bundler, InjectedScriptVite, InjectedScriptWebpack } from '../types'

export function injectScripts(
  scripts: { content: string; type?: string }[],
  bundler: 'vite',
): InjectedScriptVite[] | void
export function injectScripts(
  scripts: { content: string; type?: string }[],
  bundler: 'webpack',
): InjectedScriptWebpack[] | void
export function injectScripts(
  scripts: { content: string; type?: string }[],
  bundler: Bundler,
): InjectedScriptVite[] | InjectedScriptWebpack[] | void {
  switch (bundler) {
    case 'vite':
      return scripts.map((script) => ({
        tag: 'script' as const,
        attrs: { type: script.type || 'text/javascript' },
        children: script.content,
        injectTo: 'head-prepend' as const,
      }))
    case 'webpack':
      return scripts.map((script) => ({
        tagName: 'script' as const,
        voidTag: false as const,
        attributes: { type: script.type || 'text/javascript' },
        innerHTML: script.content,
        meta: {},
      }))
    default:
      throw new Error(`Unsupported bundler: ${bundler as string}`)
  }
}

export function magicMockCoreToInject() {
  const clientScriptPath = require.resolve('@magicmock/core/client')

  if (!existsSync(clientScriptPath)) {
    console.warn('⚠️ Client script not found. Make sure @magicmock/core is built first.')
    console.warn('   Expected:', clientScriptPath)
    return null
  }

  return readFileSync(clientScriptPath, 'utf-8')
}

export function configurationToInject(
  apiPrefix: string,
  getCachePath: string,
  setCachePath: string,
) {
  return `window["${GLOBAL_CONFIG_KEY}"] = ${JSON.stringify({
    apiPrefix,
    getCachePath,
    setCachePath,
  } as MagicMockEndpointPaths)}`
}
