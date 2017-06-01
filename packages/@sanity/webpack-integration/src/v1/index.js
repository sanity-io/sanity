const path = require('path')
const lost = require('lost')
const postcssUrl = require('postcss-url')
const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const PartResolverPlugin = require('@sanity/webpack-loader')
const resolveStyleImport = require('./resolveStyleImport')

const partLoaderPath = require.resolve('@sanity/webpack-loader/lib/partLoader')

const absolute = /^(\/|\w+:\/\/)/
const isAbsolute = url => absolute.test(url)

function resolveUrl(url, decl, from, dirname) {
  return isAbsolute(url) ? url : path.resolve(dirname, url)
}

function getPartResolverPlugin(options) {
  return new PartResolverPlugin({basePath: options.basePath})
}

function getPlugins(options) {
  return [getPartResolverPlugin(options)]
}

function getPartLoader(options) {
  return {
    test: /[?&]sanityPart=/,
    loader: partLoaderPath
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
  return [importer, postcssCssnext, urlPlugin, lost]
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
  getPartLoader: getPartLoader,
  getStyleResolver: getStyleResolver,
  getPartResolverPlugin: getPartResolverPlugin,
  getPostcssImportPlugin: getPostcssImportPlugin,
  getPostcssUrlPlugin: getPostcssUrlPlugin,
  getPostcssPlugins: getPostcssPlugins,
  getConfig: getConfig
}
