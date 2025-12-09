# Magic Mock - Vue CLI Pokemon Explorer

This example demonstrates Magic Mock integration with **Vue CLI (Webpack)** and Vue 3. The demo fetches multiple Pokemon from the PokeAPI sequentially to showcase the performance benefits of magic-mock in a Webpack-based environment.

> **Note**: This example uses `@magicmock/unplugin` with Webpack via Vue CLI. It supports **persistent filesystem caching** (`.request-cache/` directory) that can be committed to git for team collaboration.

## Why This Example Matters

Many existing Vue applications use **Vue CLI** with Webpack as their build tool. This example demonstrates how to integrate Magic Mock into a Vue CLI project using the unplugin architecture, which provides automatic request interception with filesystem-based caching.

## What This Example Does

The example creates a Pokemon explorer that:

- Fetches multiple Pokemon from PokeAPI sequentially (one at a time)
- Allows selection of 1, 5, 10, 25, or 50 Pokemon to fetch
- Displays Pokemon cards with sprites, types, and stats
- Shows total request time and average time per Pokemon to demonstrate the speed difference between real API calls and cached responses
- Uses Magic Mock's recording/mocking UI to control request behavior
- Stores cached responses in `.request-cache/` directory for persistence

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

## Project Structure

```
cli-vue/
├── src/
│   ├── App.vue              # Main Pokemon Explorer component
│   └── main.js              # App entry point
├── vue.config.js            # Webpack configuration with Magic Mock plugin
├── package.json             # Dependencies (@magicmock/unplugin)
├── .request-cache/          # Cached API responses (git-shareable)
└── README.md               # This file
```

## How to Run

### Prerequisites

Install dependencies from the monorepo root:

```bash
pnpm install
```

### Running the Example

```bash
# Navigate to the example directory
cd examples/cli-vue

# Start the development server
pnpm run serve
```

The application will be available at `http://localhost:8080` (or another port if 8080 is in use).

## Usage

1. **Initial Load**: The page loads with a selectbox and "Fetch Pokemon" button
2. **Click "⏺ Record"** (top-right button): Enables recording mode
3. **Select Pokemon count**: Choose 1, 5, 10, 25, or 50 Pokemon
4. **Click "Fetch Pokemon"**: Makes real API calls to PokeAPI sequentially, records responses, and displays Pokemon cards with total time
5. **Check `.request-cache/` directory**: You'll see JSON files containing cached responses
6. **Click "🔄 Mock"**: Switches to mock mode
7. **Click "Fetch Pokemon" again**: Serves all cached responses instantly (notice the dramatically lower time!)

### Expected Behavior

- **Recording Mode (50 Pokemon)**: Total time typically 900ms-2000ms
- **Mocking Mode (50 Pokemon)**: Total time typically 100-250ms (3-10x faster!)
- **Off Mode**: Normal behavior, no interception

## Technical Details

### Webpack Integration

The example uses the Magic Mock unplugin with Vue CLI's Webpack configuration:

```javascript
// vue.config.js
const MagicMock = require('@magicmock/unplugin/webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      MagicMock({
        cacheDir: '.request-cache',
        enabled: true,
      })
    ]
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Custom middleware for cache read/write operations
      // See vue.config.js for full implementation
      return middlewares
    }
  }
}
```

The plugin automatically:
- Injects the Magic Mock client script into your application
- Sets up dev server middleware to handle cache read/write operations
- Provides the recording/mocking UI buttons

### Sequential Request Pattern (Intentional Design)

This example intentionally fetches Pokemon **sequentially** (one at a time) rather than in parallel. This design choice dramatically demonstrates the performance difference between recording and mocking modes:

```javascript
// Sequential fetching with await in a for loop
const results = []
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

- **Recording Mode**: Each Pokemon takes ~200ms from the real API
  - 50 Pokemon × 200ms = ~10 seconds total
- **Mocking Mode**: Each cached Pokemon returns in ~2ms
  - 50 Pokemon × 2ms = ~100ms total
- **Result**: A clear, dramatic 100x performance improvement

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

Cached responses are stored in the `.request-cache/` directory as JSON files with base64-encoded URLs as filenames. These files can be committed to git for team collaboration.

### Key Features Demonstrated

✅ **Webpack Integration**: Works seamlessly with Vue CLI and Webpack
✅ **Vue 3 Composition API**: Uses modern Vue patterns with `<script setup>`
✅ **Filesystem Caching**: Persistent cache stored in `.request-cache/` directory
✅ **Sequential Request Handling**: Demonstrates clear performance benefits with sequential API calls
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Benefits**: Dramatic speed improvement visible with 25-50 Pokemon
✅ **Git-shareable Mocks**: Team members can share cached responses via git
✅ **Progressive UI Updates**: Shows Pokemon as they load for better user experience

## Scripts

### Development

```bash
pnpm run serve
```

Starts the Webpack dev server with hot-reload at `http://localhost:8080`.

### Build

```bash
pnpm run build
```

Compiles and minifies the application for production.

### Lint

```bash
pnpm run lint
```

Lints and fixes files using ESLint.

## Vue CLI vs Vite Comparison

This example uses Vue CLI (Webpack), while the [vite-vue example](../vite-vue/) uses Vite. Both support the same Magic Mock features:

| Feature                | Vue CLI (Webpack)   | Vite                |
| ---------------------- | ------------------- | ------------------- |
| Fetch Support          | ✅                  | ✅                  |
| Filesystem Caching     | ✅                  | ✅                  |
| Dev Server Middleware  | ✅                  | ✅                  |
| Hot Module Replacement | ✅                  | ✅ (Faster)         |
| Build Speed            | Slower              | Much Faster         |
| Configuration          | vue.config.js       | vite.config.js      |

**When to use Vue CLI**: Existing projects, legacy browser support, specific Webpack plugins

**When to use Vite**: New projects, faster development experience, modern browsers

## Plugin vs Standalone Comparison

This example uses `@magicmock/unplugin` with Webpack, which differs from the standalone approach:

| Feature             | Standalone (`@magicmock/core`) | Plugin (`@magicmock/unplugin`) |
| ------------------- | ------------------------------ | ------------------------------ |
| Fetch Support       | ✅                             | ✅                             |
| In-memory Caching   | ✅                             | ✅                             |
| Filesystem Caching  | ❌                             | ✅                             |
| Git-shareable Mocks | ❌                             | ✅                             |
| Bundler Required    | ❌                             | ✅                             |
| Setup Complexity    | Simple                         | Medium                         |

**When to use standalone**: Quick prototypes, simple HTML pages

**When to use plugin**: Team collaboration, persistent cache needed, production-like setup

## Dependencies

- **Vue 3.2+**: Vue.js framework with Composition API
- **@magicmock/unplugin**: Provides Magic Mock Webpack plugin
- **@vue/cli-service**: Vue CLI build tooling
- **PokeAPI**: Free public API for Pokemon data

## Troubleshooting

### Buttons Don't Appear

1. Check browser console for errors
2. Verify the plugin is correctly configured in `vue.config.js`
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
- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using Vite

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Vue CLI Documentation](https://cli.vuejs.org/): Learn about Vue CLI
- [Vue 3 Documentation](https://vuejs.org/): Vue.js framework guide
- [Webpack Documentation](https://webpack.js.org/): Webpack bundler guide
- [PokeAPI Documentation](https://pokeapi.co/docs/v2): Pokemon API reference
