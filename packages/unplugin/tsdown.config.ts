import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite.ts',
    webpack: 'src/webpack.ts',
    rollup: 'src/rollup.ts',
    esbuild: 'src/esbuild.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['vite', 'webpack', 'rollup', 'esbuild', '@magicmock/core', 'unplugin'],
})
