import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import parents from 'parents'
import resolveFrom from 'resolve-from'
import RoleResolverPlugin from '@sanity/webpack-loader'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import postcssPlugins from './postcssPlugins'

// Webpack 2 vs 1
const OccurrenceOrderPlugin = webpack.optimize.OccurrenceOrderPlugin || webpack.optimize.OccurenceOrderPlugin

const partLoaderPath = require.resolve('@sanity/webpack-loader/src/partLoader')

export default (config = {}) => {
  const basePath = config.basePath || process.cwd()

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
  const env = config.env || 'development'
  const isProd = env === 'production'
  const resolvePaths = parents(basePath).map(dir => path.join(dir, 'node_modules'))

  const cssExtractor = isProd
    && new ExtractTextPlugin('css/main.css', {allChunks: true})

  const baseCssLoader = 'css-loader?modules&localIdentName=[name]_[local]_[hash:base64:5]&importLoaders=1'
  const cssLoader = isProd
    ? `${baseCssLoader}&minimize`
    : `${baseCssLoader}&sourceMap`

  const commonChunkPlugin = (
    typeof config.commonChunkPlugin === 'undefined'
    || config.commonChunkPlugin
  ) && new webpack.optimize.CommonsChunkPlugin('vendor', 'js/vendor.bundle.js')

  return {
    entry: {
      app: [
        require.resolve('normalize.css'),
        path.join(__dirname, '..', 'browser', 'entry')
      ],
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
        'react': path.dirname(reactPath),
        'react-dom': path.dirname(reactDomPath)
      }
    },
    resolveLoader: {
      root: resolvePaths
    },
    module: {
      loaders: [{
        test: /\.jsx?/,
        exclude: modPath => modPath.indexOf('/node_modules/') >= 0,
        loader: 'babel',
        query: babelConfig || {
          presets: [
            require.resolve('babel-preset-react'),
            require.resolve('babel-preset-es2015')
          ],
          plugins: [
            require.resolve('babel-plugin-syntax-class-properties'),
            require.resolve('babel-plugin-transform-class-properties')
          ],
          cacheDirectory: true
        }
      }, {
        test: /\.json$/,
        loader: 'json'
      }, {
        test: /\.css(\?|$)/,
        loader: isProd && cssExtractor.extract([cssLoader, 'postcss-loader']),
        loaders: !isProd && ['style-loader', cssLoader, 'postcss-loader']
      }, {
        test: /\.(jpe?g|png|gif|svg|webp)$/,
        loader: require.resolve('file-loader'),
        query: {
          name: 'assets/[name]-[hash].[ext]'
        }
      }, {
        test: /[?&]sanityPart=/,
        loader: partLoaderPath
      }]
    },
    plugins: [
      cssExtractor,
      new OccurrenceOrderPlugin(),
      new webpack.ResolverPlugin([new RoleResolverPlugin({basePath})], ['normal']),
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
