# Magic Mock - Vite + Vue Pokemon Explorer

This example demonstrates Magic Mock's integration with **Vite + Vue 3**, a modern build tool that provides lightning-fast development experience. The demo fetches multiple Pokemon from the PokeAPI sequentially to showcase the dramatic performance benefits of magic-mock in a modern Vite-based environment.

> **Note**: This example uses `@magicmock/unplugin` with Vite. It supports **persistent filesystem caching** (`.request-cache/` directory) that can be committed to git for team collaboration.

## Why This Example Matters

While standalone examples demonstrate core functionality, **Vite** is the modern standard for Vue 3 development, offering blazing-fast hot module replacement and optimized builds. This example proves that Magic Mock integrates seamlessly with Vite's dev server and provides filesystem-based caching for team collaboration.

## What This Example Does

The example creates a Pokemon explorer that:

- Fetches multiple Pokemon from PokeAPI sequentially (one at a time)
- Allows selection of 1, 5, 10, 25, or 50 Pokemon to fetch
- Displays Pokemon cards with sprites, types, and stats
- Shows total request time and average time per Pokemon to demonstrate the speed difference between real API calls and cached responses
- Uses Magic Mock's recording/mocking UI to control request behavior

## Sequential Fetching (Intentional Design Choice)

**This example fetches Pokemon sequentially (one after another) rather than in parallel.** This is an intentional design choice to better demonstrate the performance benefits of Magic Mock's caching.

**Performance with Good Network** (50 Pokemon):
- **Recording Mode (real API)**: ~900ms total (~18ms per Pokemon)
- **Mocking Mode (cached)**: ~100-250ms total (~2-5ms per Pokemon)
- **Speed Improvement**: Approximately 3-10x faster with caching

**Why Sequential?**
- **Dramatic demonstration**: Sequential requests make the caching performance difference more visible
- **Real-world relevance**: Many applications use sequential requests (pagination, rate-limited APIs, dependent requests)
- **Works both ways**: Magic Mock works equally well with parallel requests (Promise.all), but sequential fetching better showcases the caching benefits in this demo

**Performance Demonstration**: When fetching 50 Pokemon:
- **Recording Mode (real API)**: ~900ms total (~18ms per Pokemon with good network)
- **Mocking Mode (cached)**: ~100-250ms total (~2-5ms per Pokemon)
- **Speed Improvement**: Approximately 3-10x faster with caching

## Project Structure

```
vite-vue/
├── src/
│   ├── App.vue              # Main Pokemon Explorer component
│   ├── main.ts              # App entry point
│   └── assets/              # Static assets
├── vite.config.ts           # Vite configuration with Magic Mock plugin
├── package.json             # Dependencies (@magicmock/unplugin)
├── tsconfig.json            # TypeScript configuration
├── .request-cache/          # Cached API responses (git-shareable)
└── README.md               # This file
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

   The plugin automatically injects the client script and sets up filesystem caching.

### Running the Example

```bash
# Start the development server
pnpm dev
```

Then open your browser to `http://localhost:5173`

## Usage

1. **Initial Load**: The page loads with a selectbox and "Fetch Pokemon" button
2. **Click "⏺ Record"** (top-right button): Enables recording mode
3. **Select Pokemon count**: Choose 1, 5, 10, 25, or 50 Pokemon
4. **Click "Fetch Pokemon"**: Makes real API calls to PokeAPI sequentially, records responses, and displays Pokemon cards with total time
5. **Click "🔄 Mock"**: Switches to mock mode
6. **Click "Fetch Pokemon" again**: Serves all cached responses instantly (notice the dramatically lower time!)

### Expected Behavior

- **Recording Mode (50 Pokemon)**: Total time typically 900ms
- **Mocking Mode (50 Pokemon)**: Total time typically 100-250ms (3-10x faster!)
- **Off Mode**: Normal behavior, no interception

## Technical Details

### Sequential Request Pattern (Intentional Design)

This example intentionally fetches Pokemon **sequentially** (one at a time) rather than in parallel. This design choice dramatically demonstrates the performance difference between recording and mocking modes:

```typescript
// Sequential fetching with await in a for loop
const results: Pokemon[] = []
for (const name of selectedPokemon) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
  if (!res.ok) throw new Error('Failed to fetch')
  const pokemon = await res.json()
  results.push(pokemon)

  // Progressive UI update: show Pokemon as they load
  pokemonList.value = [...results]
}
```

**Why Sequential?**

Sequential fetching amplifies the performance difference to make Magic Mock's caching capabilities more visible:

- **Recording Mode**: Each Pokemon takes ~18ms from the real API
  - 50 Pokemon × 18ms = ~900ms total
- **Mocking Mode**: Each cached Pokemon returns in ~2-5ms
  - 50 Pokemon × 2-5ms = ~100-250ms total
- **Result**: A clear, dramatic 3-10x performance improvement

**Real-World Relevance:**

While this example uses sequential requests for demonstration purposes, this pattern is common in production applications:
- **Pagination**: Loading one page at a time
- **Rate-limited APIs**: Respecting API rate limits by throttling requests
- **Dependent requests**: Each request depends on the previous response
- **Progressive loading**: Showing results incrementally for better UX

**Note**: Magic Mock works equally well with parallel requests using `Promise.all()`. The sequential approach simply makes the performance benefits more obvious for educational purposes.

### What Gets Cached

When you record requests, Magic Mock stores:

- Full URL for each Pokemon
- Response body with Pokemon data (sprites, types, stats)
- HTTP status code
- Response headers

**Important**: In this Vite example, cached responses are stored in the **`.request-cache/` directory** as JSON files with base64-encoded filenames. These files can be committed to git for team collaboration.

For **in-memory only** caching (browser localStorage), see the [Simple Axios example](../simple-axios/) or [Simple jQuery example](../simple-jquery/).

### Key Features Demonstrated

✅ **Vite Integration**: Works seamlessly with Vite's fast dev server
✅ **Vue 3 Composition API**: Uses modern Vue patterns with `<script setup>` and TypeScript
✅ **Filesystem Caching**: Persistent cache stored in `.request-cache/` directory
✅ **Sequential Request Handling**: Demonstrates clear performance benefits with sequential API calls
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Benefits**: Dramatic 3-10x speed improvement visible with 25-50 Pokemon
✅ **Git-shareable Mocks**: Team members can share cached responses via git
✅ **Progressive UI Updates**: Shows Pokemon as they load for better user experience

## Future Enhancements

The UI is designed with space for additional buttons to demonstrate POST, PUT, and DELETE methods in future updates. The current implementation focuses on GET requests to establish the baseline functionality.

## Plugin vs Standalone Comparison

This example uses `@magicmock/unplugin` with Vite, which differs from the standalone approach:

| Feature             | Plugin (`@magicmock/unplugin`) | Standalone (`@magicmock/core`) |
| ------------------- | ------------------------------ | ------------------------------ |
| Fetch Support       | ✅                             | ✅                             |
| XHR Support         | ✅                             | ✅                             |
| In-memory Caching   | ✅                             | ✅                             |
| Filesystem Caching  | ✅                             | ❌                             |
| Git-shareable Mocks | ✅                             | ❌                             |
| Bundler Required    | ✅                             | ❌                             |
| Setup Complexity    | Medium                         | Simple                         |

**When to use plugin**: Team collaboration, persistent cache needed, modern build tools

**When to use standalone**: Quick prototypes, simple HTML pages, no build step required

This makes Magic Mock with Vite suitable for:

- Modern Vue 3 applications with fast development
- Team collaboration with shared cached responses
- Production-ready applications with TypeScript
- Demonstrating performance benefits with sequential request patterns

## Dependencies

- **Vue 3.5+**: Vue.js framework with Composition API
- **Vite 7+**: Next-generation frontend build tool
- **@magicmock/unplugin**: Provides Magic Mock Vite plugin
- **TypeScript 5+**: Type safety and better developer experience
- **PokeAPI**: Free public API for Pokemon data

## Troubleshooting

### Buttons Don't Appear

1. Check browser console for errors
2. Verify the plugin is correctly configured in `vite.config.ts`
3. Ensure the dev server is running

### Requests Not Being Cached

1. Check browser console for errors
2. Ensure recording mode is enabled before making requests
3. Verify the `.request-cache/` directory is created
4. Check file permissions on the cache directory

### Mock Mode Not Working

1. Make sure you've recorded at least one request first
2. Verify the exact URL matches (including query parameters)
3. Check the `.request-cache/` directory for cached response files
4. Verify the cache files have valid JSON content

### Some Pokemon Not Loading

The example uses a predefined list of 50 Pokemon names. If you encounter issues, check the browser console for specific API errors.

## Related Examples

- [Simple Axios Example](../simple-axios/): Standalone example using Axios HTTP client
- [Simple jQuery Example](../simple-jquery/): Standalone example using jQuery
- [Vue CLI Example](../cli-vue/): Vue 3 application using Vue CLI and Webpack

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Vite Documentation](https://vite.dev/): Learn about Vite
- [Vue 3 Documentation](https://vuejs.org/): Vue.js framework guide
- [PokeAPI Documentation](https://pokeapi.co/docs/v2): Pokemon API reference
