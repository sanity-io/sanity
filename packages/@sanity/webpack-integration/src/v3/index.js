const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const PartResolverPlugin = require('@sanity/webpack-loader')
const resolveStyleImport = require('./resolveStyleImport')

const partLoaderPath = require.resolve('@sanity/webpack-loader/lib/partLoader')

function getPartResolverPlugin(options) {
  return new PartResolverPlugin(options)
}

function getEnvPlugin(options) {
  // eslint-disable-next-line no-process-env
  const bundleEnv = options.bundleEnv || process.env.BUNDLE_ENV || 'development'
  const env = options.env || 'development'
  const isProd = env === 'production'
  const webpack = options.webpack || require('webpack')
  return new webpack.DefinePlugin({__DEV__: !isProd && bundleEnv === 'development'})
}

function getPlugins(options) {
  return [getPartResolverPlugin(options), getEnvPlugin(options)]
}

function getPartLoader(options) {
  return {
    resourceQuery: /[?&]sanityPart=/,
    use: partLoaderPath
  }
}

function getLoaders(options) {
  return [getPartLoader(options)]
}

function getStyleResolver(options) {
  return resolveStyleImport({from: options.basePath})
}

function getPostcssImportPlugin(options) {
  const styleResolver = getStyleResolver(options)
  const importer = postcssImport({resolve: styleResolver})
  return importer
}

function getPostcssPlugins(options) {
  const importer = getPostcssImportPlugin(options)
  const nextOpts = options.cssnext
  return [importer, postcssCssnext(nextOpts)]
}

function getConfig(options) {
  return {
    plugins: getPlugins(options),
    loaders: getLoaders(options),
    postcss: () => ({
      plugins: getPostcssPlugins(options)
    })
  }
}

module.exports = {
  getPlugins: getPlugins,
  getLoaders: getLoaders,
  getEnvPlugin: getEnvPlugin,
  getPartLoader: getPartLoader,
  getStyleResolver: getStyleResolver,
  getPartResolverPlugin: getPartResolverPlugin,
  getPostcssImportPlugin: getPostcssImportPlugin,
  getPostcssPlugins: getPostcssPlugins,
  getConfig: getConfig
}
