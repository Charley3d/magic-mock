# Magic Mock - jQuery XHR Example

This example demonstrates Magic Mock's compatibility with **XMLHttpRequest (XHR)**, the traditional HTTP request API used by jQuery and other legacy libraries.

> **Note**: This is a standalone example using `@magicmock/core` directly. It stores mocks in **memory only** (browser storage). For persistent filesystem caching, use the `@magicmock/unplugin` with a bundler like Vite or Webpack.

## Why This Example Matters

Modern frameworks like React and Vue typically use the `fetch` API, but many existing applications still rely on jQuery's `$.ajax()` method, which uses the older XHR standard under the hood. This example proves that Magic Mock works seamlessly with both modern and legacy HTTP request methods.

## What This Example Does

The example creates a simple web page that:

- Fetches GitHub repository events for the React project using jQuery's `$.ajax()`
- Displays the events in a formatted list with timestamps
- Shows request round-trip time (RTT) to demonstrate the speed difference between real API calls and cached responses
- Uses Magic Mock's recording/mocking UI to control request behavior

## Project Structure

```
simple-jquery/
├── index.html           # Main HTML page with jQuery integration
├── main.js              # Application logic using $.ajax()
├── package.json         # Dependencies (@magicmock/core)
├── client-script.js     # Magic Mock client (from @magicmock/core)
├── mockServiceWorker.js # MSW worker (from @magicmock/core)
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

   # If you use MSW directly and want auto-updates
   npx @magicmock/core init ./public --save
   ```
   This copies the necessary client scripts and service worker to the specified directory (or current directory), and automatically runs MSW initialization.

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

### jQuery XHR vs Modern Fetch

jQuery uses `XMLHttpRequest` under the hood:

```javascript
$.ajax({
  url: 'https://api.github.com/repos/facebook/react/events',
  method: 'GET',
  dataType: 'json',
  success: function (data) {
    /* ... */
  },
  error: function (xhr, status, error) {
    /* ... */
  },
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

✅ **XHR Compatibility**: Works with jQuery's `$.ajax()`, `$.get()`, `$.post()`, etc.
✅ **Legacy Browser Support**: Compatible with older codebases
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

**When to use standalone**: Quick prototypes, simple HTML pages, testing XHR compatibility

**When to use plugin**: Team collaboration, persistent cache needed

This makes Magic Mock suitable for:

- Migrating legacy jQuery applications
- Working with hybrid codebases (mix of jQuery and modern JS)
- Maintaining older projects that can't easily migrate from jQuery

## Dependencies

- **jQuery 3.6.0**: Loaded from CDN for XHR-based requests
- **@magicmock/core**: Provides Magic Mock client and MSW integration

## Troubleshooting

### Buttons Don't Appear

Make sure the page is served over HTTP (not `file://`). Service workers require HTTP/HTTPS to function.

### Requests Not Being Cached

1. Check browser console for errors
2. Verify the service worker is registered (Chrome DevTools → Application → Service Workers)
3. Ensure recording mode is enabled before making requests

### Mock Mode Not Working

1. Make sure you've recorded at least one request first
2. Verify the exact URL matches (including query parameters)
3. Check browser DevTools → Application → Cache Storage for the MSW cache
4. Note: This standalone version uses in-memory caching only (no `.request-cache/` directory)

## Related Examples

- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using fetch API
- [Webpack + Vue CLI Example](../vue-cli/): Vue CLI project with Webpack configuration

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [jQuery Documentation](https://api.jquery.com/jquery.ajax/): Learn about `$.ajax()`
- [XMLHttpRequest MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest): Understanding the XHR API
