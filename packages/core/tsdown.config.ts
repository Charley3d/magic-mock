import { defineConfig } from 'tsdown'

export default defineConfig([
  // Main library entry - compile TypeScript with declarations
  {
    entry: 'src/index.ts',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    outExtensions: () => ({ js: '.js' }),
  },
  // Client script bundle (non-standalone mode)
  {
    entry: 'src/client-script.ts',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outExtensions: () => ({ js: '.js' }),
    define: {
      __STANDALONE__: 'false',
    },
  },
  // Standalone client script bundle
  {
    entry: 'src/client-script.ts',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/standalone',
    minify: true,
    outExtensions: () => ({ js: '.js' }),
    define: {
      __STANDALONE__: 'true',
    },
  },
  // Endpoints, allowing unplugin to import and configure endpoint paths
  {
    entry: 'src/config/endpoints.ts',
    format: ['esm'],
    dts: true,
    outDir: 'dist/endpoints',
    minify: true,
    outExtensions: () => ({ js: '.js' }),
  },
  // CLI
  {
    entry: 'bin/cli.ts',
    format: ['esm'],
    outDir: 'dist',
    banner: '#!/usr/bin/env node',
    outExtensions: () => ({ js: '.js' }),
    noExternal: [/.*/],
  },
])
