# Magic Mock - Axios Pokemon Explorer

This example demonstrates Magic Mock's compatibility with **Axios**, a popular promise-based HTTP client that uses **XMLHttpRequest (XHR)** under the hood. The demo fetches multiple Pokemon from the PokeAPI in parallel using `Promise.all` to showcase the performance benefits of magic-mock.

> **Note**: This is a standalone example using `@magicmock/core` directly. It stores mocks in **memory only** (browser storage). For persistent filesystem caching, use the `@magicmock/unplugin` with a bundler like Vite or Webpack.

## Why This Example Matters

While modern frameworks often use the `fetch` API, **Axios** remains one of the most popular HTTP clients in the JavaScript ecosystem, used extensively in React, Vue, and Node.js applications. Axios uses **XMLHttpRequest (XHR)** in browsers, which differs from the fetch API. This example proves that Magic Mock works seamlessly with Axios and XHR-based libraries.

## What This Example Does

The example creates a Pokemon explorer that:

- Fetches multiple Pokemon from PokeAPI in parallel using `Promise.all`
- Allows selection of 1, 5, 10, 25, or 50 Pokemon to fetch
- Displays Pokemon cards with sprites, types, and stats
- Shows total request time and average time per Pokemon to demonstrate the speed difference between real API calls and cached responses
- Uses Magic Mock's recording/mocking UI to control request behavior

**Performance Demonstration**: When fetching 50 Pokemon:
- **Recording Mode (real API)**: ~5000-10000ms total
- **Mocking Mode (cached)**: ~50-200ms total (100x faster!)

## Project Structure

```
simple-axios/
├── index.html           # Main HTML page with Pokemon UI
├── main.js              # Application logic using axios and Promise.all
├── package.json         # Dependencies (@magicmock/core)
├── client-script.js     # Magic Mock client (from @magicmock/core)
└── README.md           # This file
```

## How to Run

### Prerequisites

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Initialize Magic Mock (if not already done):

   ```bash
   # Basic usage (standalone, no package.json modification)
   npx @magicmock/core init

   # With --save flag to add to package.json scripts
   npx @magicmock/core init ./ --save
   ```

   This copies the necessary client scripts to the specified directory (or current directory) for request recording and mocking.

### Running the Example

Since this is a standalone HTML example (no bundler), you need to serve it with a local HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open your browser to `http://localhost:8000`

## Usage

1. **Initial Load**: The page loads with a selectbox and "Fetch Pokemon" button
2. **Click "⏺ Record"** (top-right button): Enables recording mode
3. **Select Pokemon count**: Choose 1, 5, 10, 25, or 50 Pokemon
4. **Click "Fetch Pokemon"**: Makes real API calls to PokeAPI in parallel, records responses, and displays Pokemon cards with total time
5. **Click "🔄 Mock"**: Switches to mock mode
6. **Click "Fetch Pokemon" again**: Serves all cached responses instantly (notice the dramatically lower time!)

### Expected Behavior

- **Recording Mode (50 Pokemon)**: Total time typically 5000-10000ms
- **Mocking Mode (50 Pokemon)**: Total time typically 50-200ms (100x faster!)
- **Off Mode**: Normal behavior, no interception

## Technical Details

### Parallel Requests with Promise.all

The example demonstrates efficient parallel request handling:

```javascript
const requests = selectedPokemon.map((name) =>
  axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)
)

Promise.all(requests)
  .then(function (responses) {
    // All requests completed in parallel
    responses.forEach(function (response) {
      displayPokemon(response.data)
    })
  })
```

Magic Mock intercepts each Axios request at the XHR level and provides the same recording/mocking functionality for all parallel requests.

### What Gets Cached

When you record requests, Magic Mock stores:

- Full URL for each Pokemon
- Response body with Pokemon data (sprites, types, stats)
- HTTP status code
- Response headers

**Important**: In this standalone example, cached responses are stored **in-memory only** using the browser's localStorage. They will persist across page reloads but are specific to your browser.

For **persistent filesystem caching** (`.request-cache/` directory with JSON files that can be committed to git), you need to use `@magicmock/unplugin` with a bundler. See the [Vite + Vue example](../vite-vue/) for filesystem-based caching.

### Key Features Demonstrated

✅ **XHR Compatibility**: Works with Axios's `axios.get()`, `axios.post()`, `axios.put()`, `axios.delete()`
✅ **Promise.all Support**: Handles multiple parallel requests efficiently
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Benefits**: Dramatic speed improvement visible with 25-50 Pokemon
✅ **State Persistence**: Mock/record state persists across page reloads (localStorage)

## Future Enhancements

The UI is designed with space for additional buttons to demonstrate POST, PUT, and DELETE methods in future updates. The current implementation focuses on GET requests to establish the baseline functionality.

## Standalone vs Plugin Comparison

This example uses `@magicmock/core` standalone, which differs from the bundler plugin approach:

| Feature             | Standalone (`@magicmock/core`) | Plugin (`@magicmock/unplugin`) |
| ------------------- | ------------------------------ | ------------------------------ |
| XHR Support         | ✅                             | ✅                             |
| Fetch Support       | ✅                             | ✅                             |
| In-memory Caching   | ✅                             | ✅                             |
| Filesystem Caching  | ❌                             | ✅                             |
| Git-shareable Mocks | ❌                             | ✅                             |
| Bundler Required    | ❌                             | ✅                             |
| Setup Complexity    | Simple                         | Medium                         |

**When to use standalone**: Quick prototypes, simple HTML pages, testing Axios compatibility

**When to use plugin**: Team collaboration, persistent cache needed

This makes Magic Mock suitable for:

- Testing Axios-based applications
- Working with codebases that use Axios alongside fetch
- Demonstrating XHR compatibility without a bundler setup
- Showcasing performance benefits with parallel requests

## Dependencies

- **Axios 1.6.0**: Loaded from CDN for promise-based XHR requests
- **@magicmock/core**: Provides Magic Mock client with fetch/XHR interception
- **PokeAPI**: Free public API for Pokemon data

## Troubleshooting

### Buttons Don't Appear

Make sure the page is served over HTTP (not `file://`).

### Requests Not Being Cached

1. Check browser console for errors
2. Ensure recording mode is enabled before making requests
3. Verify fetch/XHR interception is working

### Mock Mode Not Working

1. Make sure you've recorded at least one request first
2. Verify the exact URL matches (including query parameters)
3. Check browser DevTools → Application → Local Storage for the cached requests
4. Note: This standalone version uses in-memory caching only (no `.request-cache/` directory)

### Some Pokemon Not Loading

The example uses a predefined list of 50 Pokemon names. If you encounter issues, check the browser console for specific API errors.

## Related Examples

- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using fetch API
- [Webpack + Vue CLI Example](../cli-vue/): Vue CLI project with Webpack configuration
- [Simple jQuery Example](../simple-jquery/): Another standalone example with jQuery

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Axios Documentation](https://axios-http.com/docs/intro): Learn about Axios
- [XMLHttpRequest MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest): Understanding the XHR API
- [PokeAPI Documentation](https://pokeapi.co/docs/v2): Pokemon API reference
