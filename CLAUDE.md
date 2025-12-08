# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Monorepo Management:**
- `pnpm install` - Install dependencies for all packages
- `pnpm build` - Build all packages in the monorepo
- `pnpm dev` - Start development mode for all packages in parallel
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Run ESLint for all packages
- `pnpm format` - Format code with Prettier for all packages
- `pnpm clean` - Clean build artifacts for all packages

**Release Management:**
- `pnpm changeset` - Create a new changeset for versioning
- `pnpm changeset:version` - Apply changesets and bump versions
- `pnpm changeset:publish` - Build and publish packages to npm

**Package-specific Commands:**
- `pnpm --filter "@magicmock/core" build` - Build only the core package
- `pnpm --filter "@magicmock/unplugin" build` - Build only the unplugin package
- Navigate to `examples/` directories and run `pnpm dev` to test specific examples

## Architecture

Magic Mock is a monorepo containing HTTP request recording and mocking tools for frontend development. The repository includes core packages and multiple working examples demonstrating different integration scenarios.

### Monorepo Structure

- **`packages/core`** - Core client-side logic for request interception and UI
- **`packages/unplugin`** - Universal bundler plugin (supports Vite, Webpack, etc.)
- **`examples/`** - Working demonstrations of different integration approaches

### Core Package (`@magicmock/core`)

**`client-script.ts`** - Main browser-side functionality:
- Overrides `fetch` and `XMLHttpRequest` for request interception
- Implements recording/mocking modes with visual UI controls
- Handles FormData and binary request bodies
- Manages localStorage state persistence

**Override modules** (`override/fetch.ts`, `override/xhr.ts`):
- Separate implementations for fetch and XHR interception
- Supports GET, POST, PUT, DELETE methods
- Handles request body recording and replay

**Store modules** (`store/`):
- `LocalStore.ts` - In-memory caching for standalone usage
- `RemoteStore.ts` - Filesystem caching via dev server endpoints
- Abstract `Store.ts` interface for different storage backends

**UI module** (`ui/hud.ts`):
- Sticky control buttons for record/mock/off modes
- Real-time feedback and status indicators

### Unplugin Package (`@magicmock/unplugin`)

Universal plugin architecture supporting multiple bundlers:
- **`vite.ts`** - Vite-specific implementation with dev server middleware
- **`webpack.ts`** - Webpack plugin with custom dev server setup
- **`esbuild.ts`**, **`rollup.ts`** - Additional bundler support
- **`index.ts`** - Unified plugin interface using unplugin framework

### Request Flow Architecture

1. **Recording Mode**: 
   - Intercepts all HTTP requests (fetch/XHR)
   - Makes real API calls and captures responses
   - Stores responses in cache (filesystem via plugin or memory via standalone)

2. **Mocking Mode**:
   - Intercepts HTTP requests before they reach the network
   - Returns cached responses instantly if available
   - Falls back to real requests for uncached URLs

3. **Cache Management**:
   - Plugin mode: Stores as JSON files in `.request-cache/` directory
   - Standalone mode: Stores in memory (session-based)
   - Base64-encoded URLs as filenames for cross-platform compatibility

### Examples Structure

- **`vite-vue/`** - Modern Vue 3 + Vite with filesystem caching (plugin mode)
- **`cli-vue/`** - Vue CLI + Webpack with custom middleware setup
- **`simple-jquery/`** - Standalone HTML page with jQuery and XHR support
- **`simple-axios/`** - Standalone HTML page with Axios HTTP library

Each example demonstrates different integration patterns and serves as both documentation and testing environment for the packages.