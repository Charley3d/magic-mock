# Magic Mock

> 🎩✨ Record and replay HTTP requests for lightning-fast frontend development

Magic Mock is a zero-config development tool that records your API responses and replays them instantly. No more waiting for slow backends, broken staging environments, or flaky networks.

[![npm version](https://img.shields.io/npm/v/@magicmock/unplugin.svg)](https://www.npmjs.com/package/@magicmock/unplugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Zero Configuration** - Works out of the box with Vite, Webpack, Rollup, and esbuild
- 🚀 **Instant Responses** - Serve cached API responses at lightning speed
- 🎨 **Visual Controls** - Toggle recording/mocking with sticky UI buttons
- 💾 **Persistent Cache** - Responses saved to filesystem, shareable with your team
- 🔄 **Hot Reload Friendly** - State persists across page reloads
- 🌐 **Universal** - Works with fetch, axios, jQuery, and any HTTP library

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

**Webpack:**

```javascript
// webpack.config.js
const MagicMock = require('@magicmock/unplugin/webpack')

module.exports = {
  plugins: [
    MagicMock({
      // options
    }),
  ],
}
```

**Rollup:**

```javascript
// rollup.config.js
import MagicMock from '@magicmock/unplugin/rollup'

export default {
  plugins: [
    MagicMock({
      // options
    }),
  ],
}
```

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

1. **Recording Mode**: Intercepts HTTP requests, stores responses in `.request-cache/`
2. **Mocking Mode**: Returns cached responses instantly via MSW (Mock Service Worker)
3. **Off Mode**: Normal behavior, requests pass through

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
- 👥 **Team Collaboration** - Share cached responses via git
- 🏖️ **Demo Mode** - Present without internet/backend access
- 🐛 **Bug Reproduction** - Capture and replay problematic responses

## Comparison

| Feature        | Magic Mock | Polly.js | MSW manually | Mirage.js |
| -------------- | ---------- | -------- | ------------ | --------- |
| Zero Config    | ✅         | ❌       | ❌           | ❌        |
| Visual UI      | ✅         | ❌       | ❌           | ❌        |
| Vite Plugin    | ✅         | ❌       | ❌           | ❌        |
| Webpack Plugin | ✅         | ❌       | ❌           | ❌        |
| Auto Recording | ✅         | ✅       | ❌           | ❌        |
| File Storage   | ✅         | ✅       | Manual       | Manual    |

## Contributing

Contributions welcome! This is a monorepo managed with pnpm.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in dev mode
pnpm dev

# Run example
cd examples/vite-vue
pnpm dev
```

## License

MIT © [Charley](https://github.com/charley3d)

## Credits

Built with:

- [MSW](https://mswjs.io/) - Mock Service Worker
- [unplugin](https://github.com/unjs/unplugin) - Universal plugin system
