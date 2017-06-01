const lost = require('lost')
const postcssUrl = require('postcss-url')
const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const PartResolverPlugin = require('@sanity/webpack-loader')
const resolveStyleImport = require('./resolveStyleImport')

const partLoaderPath = require.resolve('@sanity/webpack-loader/lib/partLoader')

function getPlugins(options) {
  return [new PartResolverPlugin({basePath: options.basePath})]
}

function getLoaders(options) {
  return [{
    test: /[?&]sanityPart=/,
    loader: partLoaderPath
  }]
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
  return [importer, postcssCssnext, postcssUrl({url: 'rebase'}), lost]
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
  getStyleResolver: getStyleResolver,
  getPostcssImportPlugin: getPostcssImportPlugin,
  getPostcssPlugins: getPostcssPlugins,
  getConfig: getConfig
}
