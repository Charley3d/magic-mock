# Magic Mock - Webpack + React Pokemon Explorer

This example demonstrates Magic Mock's integration with **Webpack 5 + React 18**, a popular bundler commonly used in enterprise React applications. The demo fetches multiple Pokemon from the PokeAPI sequentially to showcase the dramatic performance benefits of magic-mock in a Webpack-based environment.

> **Note**: This example uses `@magicmock/unplugin` with Webpack. It supports **persistent filesystem caching** (`.request-cache/` directory) that can be committed to git for team collaboration.

> **Important**: Before running this example, ensure `package.json` includes `css-loader` and `style-loader` in devDependencies. See the Prerequisites section below for details.

## Why This Example Matters

While Vite is gaining popularity for new projects, **Webpack** remains the most widely used bundler in production React applications, particularly in enterprise environments. This example demonstrates that Magic Mock integrates seamlessly with Webpack's dev server and provides filesystem-based caching for team collaboration.

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

## Project Structure

```
webpack-react/
├── src/
│   ├── App.tsx              # Main Pokemon Explorer component
│   ├── App.css              # Application styles
│   └── index.tsx            # App entry point
├── public/
│   └── index.html           # HTML template
├── webpack.config.js        # Webpack configuration with Magic Mock plugin
├── package.json             # Dependencies (@magicmock/unplugin)
├── tsconfig.json            # TypeScript configuration
├── .request-cache/          # Cached API responses (git-shareable)
└── README.md                # This file
```

## How to Run

### Prerequisites

1. **Ensure CSS loaders are in package.json**: The `package.json` file must include these devDependencies:

   ```json
   "css-loader": "^7.1.2",
   "style-loader": "^4.0.0"
   ```

   These are required by the webpack configuration to handle CSS imports. Add them manually if they're not present.

2. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

3. The Magic Mock plugin is already configured in `webpack.config.js`:

   ```javascript
   const MagicMock = require('@magicmock/unplugin/webpack').default
   const { createDevServerConfig } = require('@magicmock/unplugin/webpack')

   const options = {
     endpoints: {
       apiPrefix: '/chamagic',
       getCachePath: '/restore',
       setCachePath: '/store',
     },
   }

   module.exports = {
     plugins: [
       new HtmlWebpackPlugin({
         template: './public/index.html',
       }),
       MagicMock(options),
     ],
     devServer: {
       setupMiddlewares: (middlewares, devServer) => {
         const setupEndpoints = createDevServerConfig(options)
         setupEndpoints(devServer)
         return middlewares
       },
     },
   }
   ```

   The plugin automatically injects the client script and sets up filesystem caching.

### Running the Example

```bash
# Navigate to the example directory
cd examples/webpack-react

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:8081` (port 8081 to avoid conflicts with other examples).

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

This example uses the Magic Mock unplugin with Webpack 5:

```javascript
// webpack.config.js
const MagicMock = require('@magicmock/unplugin/webpack').default
const { createDevServerConfig } = require('@magicmock/unplugin/webpack')

const options = {
  endpoints: {
    apiPrefix: '/chamagic',
    getCachePath: '/restore',
    setCachePath: '/store',
  },
}

const magicMock = MagicMock(options)

module.exports = {
  plugins: [magicMock],
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }

      // Setup Magic Mock endpoints using the helper function
      const setupEndpoints = createDevServerConfig(options)
      setupEndpoints(devServer)

      return middlewares
    },
  },
}
```

The plugin automatically:
- Injects the Magic Mock client script into your application
- Sets up dev server middleware to handle cache read/write operations
- Provides the recording/mocking UI buttons

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
  setPokemonList([...results])
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

**Important**: In this Webpack example, cached responses are stored in the **`.request-cache/` directory** as JSON files with base64-encoded filenames. These files can be committed to git for team collaboration.

For **in-memory only** caching (browser localStorage), see the [Simple Axios example](../simple-axios/) or [Simple jQuery example](../simple-jquery/).

### Key Features Demonstrated

✅ **Webpack 5 Integration**: Works seamlessly with Webpack's dev server
✅ **React 18 with TypeScript**: Uses modern React patterns with functional components and hooks
✅ **Filesystem Caching**: Persistent cache stored in `.request-cache/` directory
✅ **Sequential Request Handling**: Demonstrates clear performance benefits with sequential API calls
✅ **Transparent Interception**: No code changes required in application logic
✅ **Performance Benefits**: Dramatic 3-10x speed improvement visible with 25-50 Pokemon
✅ **Git-shareable Mocks**: Team members can share cached responses via git
✅ **Progressive UI Updates**: Shows Pokemon as they load for better user experience

## Scripts

### Development

```bash
pnpm dev
```

Starts the Webpack dev server with hot-reload at `http://localhost:8081`.

### Build

```bash
pnpm build
```

Compiles and minifies the application for production into the `dist/` directory.

### Clean

```bash
pnpm clean
```

Removes the `dist/` directory.

## Webpack vs Vite Comparison

This example uses Webpack, while the [vite-vue example](../vite-vue/) uses Vite. Both support the same Magic Mock features:

| Feature                | Webpack             | Vite                |
| ---------------------- | ------------------- | ------------------- |
| Fetch Support          | ✅                  | ✅                  |
| Filesystem Caching     | ✅                  | ✅                  |
| Dev Server Middleware  | ✅                  | ✅                  |
| Hot Module Replacement | ✅                  | ✅ (Faster)         |
| Build Speed            | Slower              | Much Faster         |
| Configuration          | webpack.config.js   | vite.config.js      |
| Enterprise Adoption    | Very High           | Growing             |

**When to use Webpack**: Existing projects, enterprise environments, specific Webpack plugins, legacy browser support

**When to use Vite**: New projects, faster development experience, modern browsers

## Plugin vs Standalone Comparison

This example uses `@magicmock/unplugin` with Webpack, which differs from the standalone approach:

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

## Dependencies

- **React 18.3+**: Modern React with hooks and concurrent features
- **React DOM 18.3+**: React renderer for web
- **Webpack 5+**: Module bundler
- **TypeScript 5+**: Type safety and better developer experience
- **@magicmock/unplugin**: Provides Magic Mock Webpack plugin
- **ts-loader**: TypeScript loader for Webpack
- **html-webpack-plugin**: Generates HTML files for Webpack bundles
- **webpack-dev-server**: Development server with hot reload
- **PokeAPI**: Free public API for Pokemon data

## Troubleshooting

### Buttons Don't Appear

1. Check browser console for errors
2. Verify the plugin is correctly configured in `webpack.config.js`
3. Ensure the dev server is running
4. Check that the `setupMiddlewares` configuration is correct

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

### Webpack Build Errors

1. Ensure all dependencies are installed: `pnpm install`
2. Check that TypeScript is correctly configured in `tsconfig.json`
3. Verify that `ts-loader` is properly configured in `webpack.config.js`
4. Clear the `dist/` directory and rebuild: `pnpm clean && pnpm build`

### Some Pokemon Not Loading

The example uses a predefined list of 50 Pokemon names. If you encounter issues, check the browser console for specific API errors.

## Related Examples

- [Vue CLI Example](../cli-vue/): Vue 3 application using Vue CLI and Webpack
- [Vite + Vue Example](../vite-vue/): Modern Vue 3 application using Vite
- [Simple Axios Example](../simple-axios/): Standalone example using Axios HTTP client
- [Simple jQuery Example](../simple-jquery/): Standalone example using jQuery

## Learn More

- [Main README](../../README.md): Full Magic Mock documentation
- [Webpack Documentation](https://webpack.js.org/): Webpack bundler guide
- [React Documentation](https://react.dev/): React library guide
- [TypeScript Documentation](https://www.typescriptlang.org/): TypeScript language guide
- [PokeAPI Documentation](https://pokeapi.co/docs/v2): Pokemon API reference
