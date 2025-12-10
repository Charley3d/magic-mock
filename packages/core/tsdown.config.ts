import { defineConfig, UserConfig } from 'tsdown'

const shared: UserConfig = {
  ignoreWatch: ['dist', 'node_modules', 'tsdown.config.ts'],
  format: ['esm' as const],
  dts: true,
  sourcemap: true,
  outExtensions: () => ({ js: '.js' }),
  minify: false,
  clean: true,
}

export default defineConfig([
  // Main library entry - compile TypeScript with declarations
  {
    entry: 'src/index.ts',
    ...shared,
  },
  {
    entry: 'src/config/index.ts',
    outDir: 'dist/config',
    ...shared,
  },
  // Client script bundle (non-standalone mode)
  {
    entry: 'src/client-script.ts',
    ...shared,
    define: {
      __STANDALONE__: 'false',
    },
  },
  // Standalone client script bundle
  {
    entry: 'src/client-script.ts',
    ...shared,
    outDir: 'dist/standalone',
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
    banner: '#!/usr/bin/env node',
    noExternal: [/.*/],
    ...shared,
  },
])
