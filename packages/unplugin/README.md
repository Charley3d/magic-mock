# @magicmock/unplugin

> Universal bundler plugin for Magic Mock

Works with Vite, Webpack, Rollup, and esbuild.

## Installation

```bash
pnpm add -D @magicmock/unplugin
```

## Usage

### Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import MagicMock from '@magicmock/unplugin/vite'

export default defineConfig({
  plugins: [MagicMock()],
})
```

### Webpack

```javascript
// webpack.config.js
const MagicMock = require('@magicmock/unplugin/webpack')

module.exports = {
  plugins: [MagicMock()],
}
```

### Rollup

```javascript
// rollup.config.js
import MagicMock from '@magicmock/unplugin/rollup'

export default {
  plugins: [MagicMock()],
}
```

### esbuild

```javascript
// esbuild.config.js
import MagicMock from '@magicmock/unplugin/esbuild'

require('esbuild').build({
  plugins: [MagicMock()],
})
```

## Options

```typescript
interface MagicMockOptions {
  /**
   * Cache directory path
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

## How It Works

1. Injects client script into your HTML
2. Sets up dev server endpoints for caching (`/api/__record`, `/api/__get-cache`)
3. Intercepts fetch and XMLHttpRequest calls for recording and mocking
4. Provides UI controls for toggling record/mock modes
5. Supports GET, POST, PUT, DELETE methods with request body recording

## License

MIT © [Charley](https://github.com/charley3d)
