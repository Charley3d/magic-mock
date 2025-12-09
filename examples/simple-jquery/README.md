# Magic Mock - jQuery Pokemon Explorer

This example demonstrates Magic Mock's compatibility with **jQuery**, a popular library that uses **XMLHttpRequest (XHR)** under the hood. The demo fetches multiple Pokemon from the PokeAPI sequentially to showcase the dramatic performance benefits of magic-mock.

> **Note**: This is a standalone example using `@magicmock/core` directly. It stores mocks in **memory only** (browser storage). For persistent filesystem caching, use the `@magicmock/unplugin` with a bundler like Vite or Webpack.

## Why This Example Matters

While modern frameworks often use the `fetch` API, **jQuery** remains widely used in existing applications and codebases. jQuery uses **XMLHttpRequest (XHR)** in browsers, which differs from the fetch API. This example proves that Magic Mock works seamlessly with jQuery's `$.ajax()` method and XHR-based libraries.

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
simple-jquery/
├── index.html           # Main HTML page with Pokemon UI
├── main.js              # Application logic using jQuery's $.ajax and Promise.all
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

### Sequential Request Pattern (Intentional Design)

This example intentionally fetches Pokemon **sequentially** (one at a time) rather than in parallel. This design choice dramatically demonstrates the performance difference between recording and mocking modes:

```javascript
// Sequential fetching with await in a for loop
const responses = []
for (const name of selectedPokemon) {
  const pokemon = await $.ajax({
    url: `https://pokeapi.co/api/v2/pokemon/${name}`,
    method: 'GET',
    dataType: 'json',
  })
  responses.push(pokemon)

  // Progressive UI update: show Pokemon as they load
  const card = createPokemonCard(pokemon)
  $('#pokemonList').append(card)
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

**Important**: In this standalone example, cached responses are stored **in-memory only** using the browser's localStorage. They will persist across page reloads but are specific to your browser.

For **persistent filesystem caching** (`.request-cache/` directory with JSON files that can be committed to git), you need to use `@magicmock/unplugin` with a bundler. See the [Vite + Vue example](../vite-vue/) for filesystem-based caching.

### Key Features Demonstrated

✅ **XHR Compatibility**: Works with jQuery's `$.ajax()`, `$.get()`, `$.post()`, etc.
✅ **Sequential Request Handling**: Demonstrates clear performance benefits with sequential API calls
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Benefits**: Dramatic 100x speed improvement visible with 25-50 Pokemon
✅ **State Persistence**: Mock/record state persists across page reloads (localStorage)
✅ **Progressive UI Updates**: Shows Pokemon as they load for better user experience

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

**When to use standalone**: Quick prototypes, simple HTML pages, testing jQuery compatibility

**When to use plugin**: Team collaboration, persistent cache needed

This makes Magic Mock suitable for:

- Testing jQuery-based applications
- Working with codebases that use jQuery alongside modern JavaScript
- Demonstrating XHR compatibility without a bundler setup
- Showcasing performance benefits with sequential request patterns

## Dependencies

- **jQuery 3.6.0**: Loaded from CDN for XHR-based requests
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

- [Simple Axios Example](../simple-axios/): Standalone example using Axios HTTP client
- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using fetch API
- [Webpack + Vue CLI Example](../cli-vue/): Vue CLI project with Webpack configuration

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [jQuery Documentation](https://api.jquery.com/jquery.ajax/): Learn about `$.ajax()`
- [XMLHttpRequest MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest): Understanding the XHR API
- [PokeAPI Documentation](https://pokeapi.co/docs/v2): Pokemon API reference
