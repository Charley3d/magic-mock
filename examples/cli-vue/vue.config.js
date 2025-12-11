const MagicMock = require('@magicmock/unplugin/webpack').default
const { createDevServerConfig } = require('@magicmock/unplugin/webpack')
const { defineConfig } = require('@vue/cli-service')

const apiPrefix = '/chamagic'
const getCachePath = '/restore'
const setCachePath = '/store'

const options = {
  endpoints: {
    apiPrefix,
    getCachePath,
    setCachePath,
  },
}

const magicMock = MagicMock(options)

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
      const setupEndpoints = createDevServerConfig(options)
      setupEndpoints(devServer)

      return middlewares
    },
  },
})
