export interface InjectedScriptVite {
  tag: 'script'
  attrs: Record<string, string> | {}
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
