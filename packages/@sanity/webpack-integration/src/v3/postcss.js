const postcssImport = require('postcss-import')
const postcssCssnext = require('postcss-cssnext')
const resolveStyleImport = require('./resolveStyleImport')

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

module.exports = {getStyleResolver, getPostcssImportPlugin, getPostcssPlugins}
