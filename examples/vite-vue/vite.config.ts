import { fileURLToPath, URL } from 'node:url'

import MagicMock from '@magicmock/unplugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(() => {
  const endpoints = {
    apiPrefix: process.env.MAGIC_MOCK_API_PREFIX || '/chamagic',
    getCachePath: process.env.MAGIC_MOCK_GET_CACHE_PATH || '/get-mock',
    setCachePath: process.env.MAGIC_MOCK_SET_CACHE_PATH || '/set-mock',
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
      MagicMock({
        endpoints,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
