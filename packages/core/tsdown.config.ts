import { defineConfig } from 'tsdown'

export default defineConfig([
  // Main library entry - compile TypeScript with declarations
  {
    entry: 'src/index.ts',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist',
    outExtensions: (ctx) => ({ js: '.js' }),
  },
  // Client script bundle (non-standalone mode)
  {
    entry: 'src/client-script.ts',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    // globalName:
    // outfile: 'dist/client-script.js',
    outExtensions: (ctx) => ({ js: '.js' }),
    define: {
      __STANDALONE__: 'false',
    },
  },
  // Standalone client script bundle
  {
    entry: 'src/client-script.ts',
    noExternal: ['msw', 'msw/browser'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/standalone',
    outExtensions: (ctx) => ({ js: '.js' }),
    define: {
      __STANDALONE__: 'true',
    },
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
