import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { requestRecorderPlugin } from './vite-plugin-request-recorder'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), requestRecorderPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
