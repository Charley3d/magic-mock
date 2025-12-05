# Magic Mock - Axios XHR Example

This example demonstrates Magic Mock's compatibility with **Axios**, a popular promise-based HTTP client that uses **XMLHttpRequest (XHR)** under the hood.

> **Note**: This is a standalone example using `@magicmock/core` directly. It stores mocks in **memory only** (browser storage). For persistent filesystem caching, use the `@magicmock/unplugin` with a bundler like Vite or Webpack.

## Why This Example Matters

While modern frameworks often use the `fetch` API, **Axios** remains one of the most popular HTTP clients in the JavaScript ecosystem, used extensively in React, Vue, and Node.js applications. Axios uses **XMLHttpRequest (XHR)** in browsers, which differs from the fetch API. This example proves that Magic Mock works seamlessly with Axios and XHR-based libraries.

## What This Example Does

The example creates a simple web page that:

- Fetches GitHub repository events for the React project using Axios
- Displays the events in a formatted list with timestamps
- Shows request round-trip time (RTT) to demonstrate the speed difference between real API calls and cached responses
- Uses Magic Mock's recording/mocking UI to control request behavior

## Project Structure

```
simple-axios/
├── index.html           # Main HTML page with Axios integration
├── main.js              # Application logic using axios.get()
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

1. **Initial Load**: The page loads with a "Fetch GitHub Events" button
2. **Click "⏺ Record"** (top-right button): Enables recording mode
3. **Click "Fetch GitHub Events"**: Makes a real API call to GitHub, records the response, and displays events with RTT
4. **Click "🔄 Mock"**: Switches to mock mode
5. **Click "Fetch GitHub Events" again**: Serves the cached response instantly (notice the much lower RTT!)

### Expected Behavior

- **Recording Mode**: RTT typically 200-1000ms (actual network request)
- **Mocking Mode**: RTT typically 1-20ms (served from cache)
- **Off Mode**: Normal behavior, no interception

## Technical Details

### Axios XHR vs Modern Fetch

Axios uses `XMLHttpRequest` under the hood in browsers:

```javascript
axios
  .get('https://api.github.com/repos/facebook/react/events?per_page=500')
  .then(function (response) {
    const data = response.data
    /* ... */
  })
  .catch(function (error) {
    console.error('Error:', error)
  })
```

Magic Mock intercepts this at the XHR level and provides the same recording/mocking functionality as it does for modern `fetch()` calls.

### What Gets Cached

When you record a request, Magic Mock stores:

- Full URL with query parameters
- Response body
- HTTP status code
- Response headers

**Important**: In this standalone example, cached responses are stored **in-memory only** using the browser's localStorage/Service Worker cache. They will persist across page reloads but are specific to your browser.

For **persistent filesystem caching** (`.request-cache/` directory with JSON files that can be committed to git), you need to use `@magicmock/unplugin` with a bundler. See the [Vite + Vue example](../vite-vue/) for filesystem-based caching.

### Key Features Demonstrated

✅ **XHR Compatibility**: Works with Axios's `axios.get()`, `axios.post()`, `axios.request()`, etc.
✅ **Promise-based API**: Demonstrates compatibility with modern promise-based HTTP clients
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Monitoring**: RTT display helps visualize the speed improvement
✅ **State Persistence**: Mock/record state persists across page reloads (localStorage)

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

## Dependencies

- **Axios 1.6.0**: Loaded from CDN for promise-based XHR requests
- **@magicmock/core**: Provides Magic Mock client with fetch/XHR interception

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

## Related Examples

- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using fetch API
- [Webpack + Vue CLI Example](../vue-cli/): Vue CLI project with Webpack configuration

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Axios Documentation](https://axios-http.com/docs/intro): Learn about Axios
- [XMLHttpRequest MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest): Understanding the XHR API
