# Magic Mock

> 🎩✨ Record and replay HTTP requests for lightning-fast frontend development

Magic Mock is a zero-config development tool that records your API responses and replays them instantly. No more waiting for slow backends, broken staging environments, or flaky networks.

[![npm version](https://img.shields.io/npm/v/@magicmock/unplugin.svg)](https://www.npmjs.com/package/@magicmock/unplugin)
[![npm version](https://img.shields.io/npm/v/@magicmock/core.svg)](https://www.npmjs.com/package/@magicmock/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ⚠️ Work in Progress

This project is under active development. APIs may change and some features are still being implemented. Feedback and contributions are welcome!

## Bundler Support

| Bundler   | Status | Notes                                               |
| --------- | ------ | --------------------------------------------------- |
| Vite      | ✅     | Fully supported                                     |
| Webpack 5 | 🚧     | Work in progress                                    |
| Vue CLI   | 🚧     | Work in progress                                    |
| Rollup    | 🚧     | Planned                                             |
| esbuild   | ❌     | Not applicable (no dev server)                      |

## Features

- 🎯 **Zero Configuration** - Works out of the box with Vite or standalone
- 🚀 **Instant Responses** - Serve cached API responses at lightning speed
- 🎨 **Visual Controls** - Toggle recording/mocking with sticky UI buttons
- 💾 **Persistent Cache** - Responses saved to filesystem (plugin) or memory (standalone)
- 🔄 **Hot Reload Friendly** - State persists across page reloads
- 🌐 **Universal** - Works with fetch, XHR, axios, jQuery, and any HTTP library
- 📦 **Flexible Deployment** - Use as bundler plugin or standalone script

## Examples

See working demonstrations in the [examples](./examples/) directory:

- **[Vite + Vue](./examples/vite-vue/)** - Modern Vue 3 application with Vite bundler and filesystem caching
- **[jQuery](./examples/simple-jquery/)** - Standalone XHR support with jQuery (no bundler)
- **[Axios](./examples/simple-axios/)** - Standalone XHR support with Axios (no bundler)
- **[Vue CLI](./examples/cli-vue/)** - Vue CLI project with Webpack configuration

## Quick Start

### Installation

```bash
# With pnpm
pnpm add -D @magicmock/unplugin

# With npm
npm install -D @magicmock/unplugin

# With yarn
yarn add -D @magicmock/unplugin
```

### Setup

**Vite:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import MagicMock from '@magicmock/unplugin/vite'

export default defineConfig({
  plugins: [
    MagicMock({
      // options (all optional)
      cacheDir: '.request-cache', // default
      enabled: true, // default
    }),
  ],
})
```

**Webpack (pure):**

```javascript
// webpack.config.js
const MagicMock = require('@magicmock/unplugin/webpack')

module.exports = {
  plugins: [
    MagicMock({
      cacheDir: '.request-cache',
      enabled: true,
    }),
  ],
}
```

**Vue CLI (Webpack):**

```javascript
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MagicMockPlugin = require('@magicmock/unplugin/webpack')
const fs = require('fs')
const path = require('path')

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      MagicMockPlugin({
        cacheDir: '.request-cache',
        enabled: true,
      }),
    ],
  },

  // Manual middleware setup required for Vue CLI
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      const cacheDir = path.join(process.cwd(), '.request-cache')
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      // Record endpoint
      devServer.app.post('/api/__record', (req, res) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const { url, response, status, headers } = JSON.parse(body)
            const filename = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_') + '.json'
            fs.writeFileSync(
              path.join(cacheDir, filename),
              JSON.stringify({ url, response, status, headers }, null, 2),
            )
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } catch (error) {
            res.writeHead(500)
            res.end()
          }
        })
      })

      // Get cache endpoint
      devServer.app.get('/api/__get-cache', (req, res) => {
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
```

**Rollup:**

_Coming soon! Stay tuned for updates._

## Standalone Usage (No Bundler)

Magic Mock can be used directly in any HTML page without a bundler, making it perfect for quick prototypes, legacy applications, or simple projects.

### Quick Setup

Initialize Magic Mock in your project directory:

```bash
# Basic usage - copies files to current directory
npx @magicmock/core init

# Specify a custom directory (e.g., ./public)
npx @magicmock/core init ./public

# With --save flag to add to package.json scripts
npx @magicmock/core init ./ --save
```

This command will:
- Copy the Magic Mock client script to your directory
- Set up request recording and mocking capabilities

### Usage in HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <h1>Hello World</h1>

    <!-- Load Magic Mock client before your app code -->
    <script src="/client-script.js"></script>
    <script src="/main.js"></script>
  </body>
</html>
```

### Standalone vs Plugin

| Feature             | Standalone (`@magicmock/core`) | Plugin (`@magicmock/unplugin`) |
| ------------------- | ------------------------------ | ------------------------------ |
| XHR Support         | ✅                             | ✅                             |
| Fetch Support       | ✅                             | ✅                             |
| In-memory Caching   | ✅                             | ✅                             |
| Filesystem Caching  | ❌                             | ✅                             |
| Git-shareable Mocks | ❌                             | ✅                             |
| Bundler Required    | ❌                             | ✅                             |
| Setup Complexity    | Simple                         | Medium                         |

**When to use standalone:**
- Quick prototypes and simple HTML pages
- Legacy applications using jQuery or vanilla JavaScript
- Testing compatibility with XHR-based libraries (Axios, jQuery)
- Projects without a build system

**When to use plugin:**
- Modern applications with Vite or Webpack
- Team collaboration requiring git-shareable mocks
- Projects needing persistent filesystem caching

## Usage

1. **Start your dev server** - Two buttons appear in the top-right corner
2. **Click "⏺ Record"** - Makes real API calls and caches responses
3. **Click "🔄 Mock"** - Serves responses from cache (instant!)
4. **Develop at lightning speed** ⚡

### Visual Demo

```
┌─────────────────────────────────┐
│  Your App        [⏺][🔄]       │  ← Sticky buttons
│                                 │
│  ┌─────────────────────────┐   │
│  │  Loading users...       │   │
│  │  ✅ Cached: /api/users  │   │  ← Console feedback
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## How It Works

1. **Recording Mode**: Intercepts HTTP requests (fetch & XHR), stores responses in `.request-cache/`
2. **Mocking Mode**: Returns cached responses instantly by intercepting fetch/XHR calls
3. **Off Mode**: Normal behavior, requests pass through

Magic Mock uses native fetch and XMLHttpRequest overrides to intercept network requests, providing:
- Support for GET, POST, PUT, DELETE methods
- Request body recording and replay
- FormData handling with file metadata
- Configurable size limits for caching
- Simulated upload delays for realistic mocking

All state persists in localStorage across page reloads.

## Packages

This is a monorepo containing:

- [`@magicmock/core`](./packages/core) - Core client-side logic
- [`@magicmock/unplugin`](./packages/unplugin) - Universal bundler plugin

## Configuration

```typescript
interface MagicMockOptions {
  /**
   * Directory to store cached requests
   * @default '.request-cache'
   */
  cacheDir?: string

  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled?: boolean
}
```

## Use Cases

- 🚀 **Faster Development** - Work offline or with slow APIs
- 🧪 **Consistent Testing** - Same responses every time
- 👥 **Team Collaboration** - Share cached responses via git (plugin mode)
- 🏖️ **Demo Mode** - Present without internet/backend access
- 🐛 **Bug Reproduction** - Capture and replay problematic responses
- 🔧 **Quick Prototyping** - Add to any HTML page with one npx command
- 🏛️ **Legacy Apps** - Works with jQuery, Axios, and XHR-based libraries

## Comparison

| Feature        | Magic Mock | Polly.js | Mirage.js |
| -------------- | ---------- | -------- | --------- |
| Zero Config    | ✅         | ❌       | ❌        |
| Visual UI      | ✅         | ❌       | ❌        |
| Vite Plugin    | ✅         | ❌       | ❌        |
| Webpack Plugin | ✅         | ❌       | ❌        |
| Auto Recording | ✅         | ✅       | ❌        |
| File Storage   | ✅         | ✅       | Manual    |
| POST/PUT/DELETE| ✅         | ✅       | ✅        |
| FormData Support| ✅        | ✅       | ❌        |

## Known Limitations

- Webpack 5 support is work in progress
- Vue CLI support is work in progress
- Rollup support is planned

## Roadmap

- [ ] Complete Webpack 5 support
- [ ] Complete Vue CLI integration
- [ ] Rollup plugin implementation
- [ ] UI for cache management
- [ ] Configuration options for excluded URLs

## Contributing

Contributions welcome! This is a monorepo managed with pnpm.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in dev mode
pnpm dev

# Run examples
cd examples/vite-vue
pnpm dev
```

## License

MIT © [Charley](https://github.com/charley3d)

## Credits

Built with:

- [unplugin](https://github.com/unjs/unplugin) - Universal plugin system
- Native fetch and XMLHttpRequest APIs for request interception
