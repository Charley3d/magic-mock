const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MagicMock = require('@magicmock/unplugin/webpack').default
const { createDevServerConfig } = require('@magicmock/unplugin/webpack')

const endpoints = {
  apiPrefix: process.env.MAGIC_MOCK_API_PREFIX || '/chamagic',
  getCachePath: process.env.MAGIC_MOCK_GET_CACHE_PATH || '/get-mock',
  setCachePath: process.env.MAGIC_MOCK_SET_CACHE_PATH || '/set-mock',
}

const magicMock = MagicMock({ endpoints })

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body',
    }),
    magicMock,
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 8081,
    hot: true,
    open: true,
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
  devtool: 'source-map',
}
