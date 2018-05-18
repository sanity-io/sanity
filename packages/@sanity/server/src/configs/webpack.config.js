import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import resolveFrom from 'resolve-from'
import webpackIntegration from '@sanity/webpack-integration/v3'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import getStaticBasePath from '../util/getStaticBasePath'
import rxPaths from 'rxjs/_esm5/path-mapping'

const resolve = mod => require.resolve(mod)

// eslint-disable-next-line complexity
export default (config = {}) => {
  const staticPath = getStaticBasePath(config)
  const env = config.env || 'development'
  const wpIntegrationOptions = {basePath: config.basePath, env: config.env}
  const basePath = config.basePath || process.cwd()
  const skipMinify = config.skipMinify || false

  const reactPath = resolveFrom.silent(basePath, 'react')
  const reactDomPath = resolveFrom.silent(basePath, 'react-dom')
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

  const cssExtractor = new ExtractTextPlugin({
    filename: 'css/main.css',
    allChunks: true,
    ignoreOrder: true,
    disable: !isProd
  })

  const postcssLoader = {
    loader: resolve('postcss-loader'),
    options: {
      config: {
        path: path.join(__dirname, 'postcss.config.js')
      }
    }
  }

  const cssLoaderLocation = resolve('css-loader')
  const baseCssLoader = `${cssLoaderLocation}?modules&localIdentName=[name]_[local]_[hash:base64:5]&importLoaders=1`
  const cssLoader =
    isProd && !skipMinify ? `${baseCssLoader}&minimize` : `${baseCssLoader}&sourceMap`

  const commonChunkPlugin =
    (typeof config.commonChunkPlugin === 'undefined' || config.commonChunkPlugin) &&
    new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'js/vendor.bundle.js'})

  return {
    entry: {
      app: [
        !isProd && resolve('react-hot-loader/patch'),
        resolve('normalize.css'),
        path.join(__dirname, '..', 'browser', isProd ? 'entry.js' : 'entry-dev.js')
      ].filter(Boolean),
      vendor: ['react', 'react-dom']
    },
    output: {
      path: config.outputPath || path.join(__dirname, '..', '..', 'dist'),
      filename: 'js/[name].bundle.js',
      publicPath: `${staticPath}/`
    },
    resolve: {
      alias: {
        react: path.dirname(reactPath),
        'react-dom': path.dirname(reactDomPath),
        moment$: 'moment/moment.js',
        ...rxPaths()
      }
    },
    module: {
      rules: [
        {
          test: /\.jsx?/,
          exclude: /(packages\/@sanity|node_modules|bower_components)/,
          use: {
            loader: resolve('babel-loader'),
            options: babelConfig || {
              presets: [resolve('babel-preset-react'), resolve('babel-preset-es2015')],
              plugins: [
                resolve('babel-plugin-syntax-class-properties'),
                resolve('babel-plugin-transform-class-properties'),
                !isProd && resolve('react-hot-loader/patch')
              ].filter(Boolean),
              cacheDirectory: true
            }
          }
        },
        {
          test: /\.css(\?|$)/,
          use: isProd
            ? ExtractTextPlugin.extract({use: [cssLoader, postcssLoader]})
            : [resolve('style-loader'), cssLoader, postcssLoader]
        },
        {
          test: /\.(jpe?g|png|gif|svg|webp|woff|woff2|ttf|eot|otf)$/,
          use: {
            loader: resolve('file-loader'),
            options: {name: 'assets/[name]-[hash].[ext]'}
          }
        },
        webpackIntegration.getPartLoader(wpIntegrationOptions)
      ]
    },
    profile: config.profile || false,
    plugins: [
      webpackIntegration.getEnvPlugin(wpIntegrationOptions),
      new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en|nb/),
      webpackIntegration.getPartResolverPlugin(wpIntegrationOptions),
      cssExtractor,
      commonChunkPlugin
    ].filter(Boolean)
  }
}

function tryRead(filePath) {
  try {
    // eslint-disable-next-line no-sync
    const content = fs.readFileSync(filePath)
    return JSON.parse(content)
  } catch (err) {
    return null
  }
}
