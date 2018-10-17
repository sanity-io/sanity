const path = require('path')
const webpack = require('webpack')
const postcssUrl = require('postcss-url')
const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const PartResolverPlugin = require('@sanity/webpack-loader')
const resolveStyleImport = require('./resolveStyleImport')

const partLoaderPath = require.resolve('@sanity/webpack-loader/lib/partLoader')

const absolute = /^(\/|\w+:\/\/)/
const isAbsolute = url => absolute.test(url)

function resolveUrl(url, decl, from, dirname) {
  if (typeof url !== 'string') {
    return url
  }

  return isAbsolute(url) ? url : path.resolve(dirname, url)
}

function getPartResolverPlugin(options) {
  return new PartResolverPlugin(options)
}

function getEnvPlugin(options) {
  // eslint-disable-next-line no-process-env
  const bundleEnv = options.bundleEnv || process.env.BUNDLE_ENV || 'development'
  const env = options.env || 'development'
  const isProd = env === 'production'

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

function getPostcssUrlPlugin(options) {
  return postcssUrl({url: resolveUrl})
}

function getPostcssPlugins(options) {
  const importer = getPostcssImportPlugin(options)
  const urlPlugin = getPostcssUrlPlugin(options)
  return [importer, postcssCssnext, urlPlugin]
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
  getPostcssUrlPlugin: getPostcssUrlPlugin,
  getPostcssPlugins: getPostcssPlugins,
  getConfig: getConfig
}
