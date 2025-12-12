const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MagicMock = require('@magicmock/unplugin/webpack').default
const { createDevServerConfig } = require('@magicmock/unplugin/webpack')

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
      const setupEndpoints = createDevServerConfig(options)
      setupEndpoints(devServer)

      return middlewares
    },
  },
  devtool: 'source-map',
}
