import { IncomingMessage, ServerResponse } from 'http'

export interface InjectedScriptVite {
  tag: 'script'
  attrs: Record<string, string>
  children: string
  injectTo: 'head' | 'head-prepend' | 'body' | 'body-prepend'
}

export interface InjectedScriptWebpack {
  tagName: 'script'
  voidTag: false
  attributes: Record<string, string>
  innerHTML: string
  meta: Record<string, unknown>
}

export type Bundler = 'vite' | 'webpack'

export type AppLike = {
  get(
    path: string,
    handler: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void | Promise<void>,
  ): unknown

  post(
    path: string,
    handler: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void | Promise<void>,
  ): unknown
}

export type DevServerLike = {
  app?: AppLike
  host?: string
  port?: number | string
  https?: boolean
  hot?: boolean
  client?: {
    overlay?: boolean | { errors?: boolean; warnings?: boolean }
    webSocketURL?: string | Record<string, unknown>
  }
  [key: string]: unknown
}
