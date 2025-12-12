const MagicMock = require('@magicmock/unplugin/webpack').default
const { createDevServerConfig } = require('@magicmock/unplugin/webpack')
const { defineConfig } = require('@vue/cli-service')

const endpoints = {
  apiPrefix: process.env.MAGIC_MOCK_API_PREFIX || '/chamagic',
  getCachePath: process.env.MAGIC_MOCK_GET_CACHE_PATH || '/get-mock',
  setCachePath: process.env.MAGIC_MOCK_SET_CACHE_PATH || '/set-mock',
}

const magicMock = MagicMock({ endpoints })

module.exports = defineConfig({
  transpileDependencies: true,

  configureWebpack: {
    plugins: [magicMock],
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }

      // Setup Magic Mock endpoints using the helper function
      const setupEndpoints = createDevServerConfig({ endpoints })
      setupEndpoints(devServer)

      return middlewares
    },
  },
})
