import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import parents from 'parents'
import resolveFrom from 'resolve-from'
import webpackIntegration from '@sanity/webpack-integration'
import ExtractTextPlugin from '@sanity/extract-text-webpack-plugin'
import postcssPlugins from './postcssPlugins'

// Webpack 2 vs 1
const OccurrenceOrderPlugin = webpack.optimize.OccurrenceOrderPlugin || webpack.optimize.OccurenceOrderPlugin

export default (config = {}) => {
  const env = config.env || 'development'
  const wpIntegrationOptions = {basePath: config.basePath, env: config.env}
  const basePath = config.basePath || process.cwd()
  const skipMinify = config.skipMinify || false

  const reactPath = resolveFrom(basePath, 'react')
  const reactDomPath = resolveFrom(basePath, 'react-dom')
  const missing = [!reactPath && '`react`', !reactDomPath && '`react-dom`'].filter(Boolean)
  if (!reactPath || !reactDomPath) {
    const missingErr = [
      `Could not find ${missing.join(', ')} dependencies in project directory`,
      'These need to be declared in `package.json` and be installed for Sanity to work'
    ].join('\n')

    throw new Error(missingErr)
  }

  const babelConfig = tryRead(path.join(basePath, '.babelrc'))
  const isProd = env === 'production'
  const bundleEnv = process.env.BUNDLE_ENV || 'development' // eslint-disable-line no-process-env
  const sanityDev = typeof process.env.SANITY_DEV !== 'undefined' // eslint-disable-line no-process-env

  const resolvePaths = parents(basePath).map(dir => path.join(dir, 'node_modules'))

  const cssExtractor = isProd
    && new ExtractTextPlugin('css/main.css', {allChunks: true, ignoreOrder: true})

  const cssLoaderLocation = require.resolve('css-loader')
  const baseCssLoader = `${cssLoaderLocation}?modules&localIdentName=[name]_[local]_[hash:base64:5]&importLoaders=1`
  const cssLoader = isProd && !skipMinify
    ? `${baseCssLoader}&minimize`
    : `${baseCssLoader}&sourceMap`

  const commonChunkPlugin = (
    typeof config.commonChunkPlugin === 'undefined'
    || config.commonChunkPlugin
  ) && new webpack.optimize.CommonsChunkPlugin('vendor', 'js/vendor.bundle.js')

  return {
    entry: {
      app: [
        !isProd && require.resolve('react-hot-loader/patch'),
        require.resolve('normalize.css'),
        path.join(__dirname, '..', 'browser', isProd ? 'entry.js' : 'entry-dev.js')
      ].filter(Boolean),
      vendor: ['react', 'react-dom']
    },
    output: {
      path: config.outputPath || path.join(__dirname, '..', '..', 'dist'),
      filename: 'js/[name].bundle.js',
      publicPath: '/static/'
    },
    resolve: {
      fallback: resolvePaths,
      alias: {
        react: path.dirname(reactPath),
        'react-dom': path.dirname(reactDomPath)
      }
    },
    resolveLoader: {
      root: resolvePaths
    },
    module: {
      loaders: [{
        test: /\.jsx?/,
        exclude: modPath => {
          if (sanityDev && modPath.indexOf('/@sanity/') >= 0) {
            return false
          }

          return modPath.indexOf('/node_modules/') >= 0
        },
        loader: require.resolve('babel-loader'),
        query: babelConfig || {
          presets: [
            require.resolve('babel-preset-react'),
            require.resolve('babel-preset-es2015')
          ],
          plugins: [
            require.resolve('babel-plugin-syntax-class-properties'),
            require.resolve('babel-plugin-transform-class-properties'),
            !isProd && require.resolve('react-hot-loader/patch')
          ].filter(Boolean),
          cacheDirectory: true
        }
      }, {
        test: /\.json$/,
        loader: require.resolve('json-loader')
      }, {
        test: /\.css(\?|$)/,
        loader: isProd && cssExtractor.extract([cssLoader, 'postcss-loader']),
        loaders: !isProd && [require.resolve('style-loader'), cssLoader, require.resolve('postcss-loader')]
      }, {
        test: /\.(jpe?g|png|gif|svg|webp|woff|woff2|ttf|eot)$/,
        loader: require.resolve('file-loader'),
        query: {
          name: 'assets/[name]-[hash].[ext]'
        }
      }, webpackIntegration.getPartLoader(wpIntegrationOptions)]
    },
    profile: config.profile || false,
    plugins: [
      new webpack.DefinePlugin({__DEV__: !isProd && bundleEnv === 'development'}),
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|nb/),
      cssExtractor,
      new OccurrenceOrderPlugin(),
      webpackIntegration.getPartResolverPlugin(wpIntegrationOptions),
      commonChunkPlugin
    ].filter(Boolean),
    postcss: postcssPlugins({basePath})
  }
}

function tryRead(filePath) {
  try {
    const content = fs.readFileSync(filePath)
    return JSON.parse(content)
  } catch (err) {
    return null
  }
}
