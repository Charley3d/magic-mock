# Magic Mock - Vite + Vue Example

This example demonstrates Magic Mock's **`@magicmock/unplugin`** integration with a modern **Vite + Vue 3** application, showcasing **persistent filesystem caching** for team collaboration.

> **Note**: This example uses the `@magicmock/unplugin` Vite plugin, which provides filesystem-based caching (`.request-cache/` directory) that can be committed to git. For standalone usage without a bundler, see the [simple-jquery](../simple-jquery/) or [simple-axios](../simple-axios/) examples.

## Why This Example Matters

This example demonstrates Magic Mock in a **real-world development setup** using Vite and Vue 3. Unlike the standalone examples that use in-memory caching, this shows how to:

- Integrate Magic Mock into a modern bundler workflow
- Store mocked responses as **git-committable JSON files** for team sharing
- Use Magic Mock with the modern **fetch API** in a Vue 3 application
- Leverage TypeScript, hot module replacement, and other modern tooling

## What This Example Does

The example creates a Vue 3 application that:

- Fetches Pokemon data from the PokeAPI using the modern `fetch()` API
- Displays Pokemon information with sprites and types
- Shows how to use Magic Mock's recording/mocking UI in a Vue application
- Demonstrates filesystem-based caching for persistent, shareable mocks

## Project Structure

```
vite-vue/
├── src/
│   ├── App.vue              # Main Vue component with fetch() calls
│   ├── main.ts              # Vue app entry point
│   └── assets/              # Static assets
├── vite.config.ts           # Vite config with MagicMock plugin
├── package.json             # Dependencies (@magicmock/unplugin)
├── tsconfig.json            # TypeScript configuration
├── .request-cache/          # Cached responses (created on first record)
└── README.md                # This file
```

## How to Run

### Prerequisites

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. The Magic Mock plugin is already configured in `vite.config.ts`:

   ```typescript
   import MagicMock from '@magicmock/unplugin/vite'
   import vue from '@vitejs/plugin-vue'
   import { defineConfig } from 'vite'

   export default defineConfig({
     plugins: [vue(), MagicMock()],
   })
   ```

### Running the Example

Start the development server:

```bash
pnpm dev
```

Then open your browser to the URL shown (typically `http://localhost:5173`)

## Usage

1. **Initial Load**: The page fetches a random Pokemon (Pikachu or Ditto) on mount
2. **Click "⏺ Record"** (top-right button): Enables recording mode
3. **Click "Fetch Pokemon"**: Makes a real API call to PokeAPI, records the response to `.request-cache/`, and displays the Pokemon
4. **Click "🔄 Mock"**: Switches to mock mode
5. **Click "Fetch Pokemon" again**: Serves the cached response instantly from the filesystem

### Expected Behavior

- **Recording Mode**: Real network request to PokeAPI, response saved to `.request-cache/[base64-url].json`
- **Mocking Mode**: Response served from `.request-cache/` directory (instant)
- **Off Mode**: Normal behavior, no interception
- **Check DevTools Console**: Look for `✅ Cached: ...` or `🔄 Serving from cache: ...` logs

## Technical Details

### Vite Plugin Integration

The `@magicmock/unplugin` package provides a Vite plugin that:

1. **Bundles MSW** (Mock Service Worker) during build
2. **Sets up dev server middleware** for recording (`/api/__record`) and cache retrieval (`/api/__get-cache`)
3. **Injects client script** and import maps into `index.html`
4. **Creates `.request-cache/` directory** for storing recorded requests as JSON files

### Filesystem vs In-Memory Caching

Unlike the standalone examples, this plugin-based approach uses **filesystem caching**:

```
.request-cache/
└── aHR0cHM6Ly9wb2tlYXBpLmNvL2FwaS92Mi9wb2tlbW9uL3Bpa2FjaHU=.json
```

Each cached request is stored as a base64-encoded filename containing:

- Full URL with query parameters
- Response body
- HTTP status code
- Response headers

**Benefits**:

- ✅ Can be committed to git for team sharing
- ✅ Persists across machine restarts and project clones
- ✅ Enables deterministic testing with real API responses
- ✅ Works offline after initial recording

### Fetch API in Vue 3

The example demonstrates using the modern `fetch()` API in a Vue 3 application:

```typescript
const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemon}`)

if (!response.ok) throw new Error('Failed to fetch')
pokemon.value = await response.json()
```

Magic Mock intercepts fetch requests seamlessly, providing the same recording/mocking functionality without requiring any code changes.

### Key Features Demonstrated

✅ **Vite Plugin Integration**: Zero-config setup with `@magicmock/unplugin`
✅ **Filesystem Caching**: Git-committable JSON files in `.request-cache/`
✅ **Fetch API Support**: Works seamlessly with modern fetch() in Vue 3
✅ **TypeScript Support**: Full type safety with Vue 3 + TS
✅ **Hot Module Replacement**: Vite's HMR works seamlessly with Magic Mock
✅ **Team Collaboration**: Share cached responses via git

## Standalone vs Plugin Comparison

This example uses `@magicmock/unplugin`, which differs from the standalone `@magicmock/core` approach:

| Feature             | Standalone (`@magicmock/core`) | Plugin (`@magicmock/unplugin`) |
| ------------------- | ------------------------------ | ------------------------------ |
| XHR Support         | ✅                             | ✅                             |
| Fetch Support       | ✅                             | ✅                             |
| In-memory Caching   | ✅                             | ✅                             |
| Filesystem Caching  | ❌                             | ✅                             |
| Git-shareable Mocks | ❌                             | ✅                             |
| Bundler Required    | ❌                             | ✅                             |
| Setup Complexity    | Simple                         | Medium                         |

**When to use plugin**: Team collaboration, persistent cache needed, modern bundler workflow

**When to use standalone**: Quick prototypes, simple HTML pages, testing compatibility

This makes the plugin suitable for:

- Team development where mocked responses need to be shared
- Deterministic testing with real API responses
- Offline development after initial API recording
- CI/CD pipelines that need consistent API responses

## Development Commands

**Development:**

- `pnpm dev` - Start Vite dev server with hot reload
- `pnpm build` - Type-check and build for production
- `pnpm preview` - Preview production build locally

**Code Quality:**

- `pnpm lint` - Run ESLint with auto-fix
- `pnpm type-check` - Run TypeScript type checking with vue-tsc
- `pnpm format` - Format code with Prettier

## Dependencies

**Core:**

- **Vue 3**: Modern reactive framework
- **Vite**: Next-generation frontend tooling
- **@magicmock/unplugin**: Magic Mock Vite plugin

## Troubleshooting

### Cached Responses Not Persisting

1. Check that `.request-cache/` directory was created in the project root
2. Verify the Vite plugin is configured correctly in `vite.config.ts`
3. Ensure recording mode is enabled before making requests
4. Check file permissions for `.request-cache/` directory

### Mock Mode Not Working

1. Make sure you've recorded at least one request first
2. Verify the exact URL matches (including query parameters)
3. Check `.request-cache/` directory for the cached JSON file
4. Look for errors in the browser console

### Plugin Not Loading

1. Ensure `@magicmock/unplugin` is installed: `pnpm install`
2. Verify the plugin is imported and added to `vite.config.ts`
3. Restart the Vite dev server after config changes
4. Check for Vite version compatibility (requires Vite 5+)

## Related Examples

- [Simple jQuery Example](../simple-jquery/): Standalone XHR example without bundler
- [Simple Axios Example](../simple-axios/): Standalone Axios example without bundler

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Vite Configuration Reference](https://vite.dev/config/): Vite config options
- [Vue 3 Documentation](https://vuejs.org/): Learn about Vue 3
- [MSW Documentation](https://mswjs.io/): Understanding Mock Service Worker
