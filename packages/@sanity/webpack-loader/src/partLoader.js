const path = require('path')
const loaderUtils = require('loader-utils')
const sanityUtil = require('@sanity/util')
const multiImplementationHandler = require('./multiImplementationHandler')

const reduceConfig = sanityUtil.reduceConfig
const getSanityVersions = sanityUtil.getSanityVersions

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_INTERNAL_ENV
const env = typeof sanityEnv === 'undefined' ? process.env.NODE_ENV : sanityEnv
/* eslint-enable no-process-env */

// eslint-disable-next-line complexity
function sanityPartLoader(input) {
  this.cacheable()

  let buildEnv = sanityEnv
  if (!buildEnv) {
    buildEnv = this.options.devtool ? env : 'production'
  }

  const qs = this.resourceQuery.substring(this.resourceQuery.indexOf('?'))
  const request = (loaderUtils.parseQuery(qs) || {}).sanityPart

  const loadAll = request.indexOf('all:') === 0
  const partName = loadAll ? request.substr(4) : request

  // In certain cases (CSS when building statically),
  // a separate compiler instance is triggered
  if (!this._compiler.sanity) {
    return input
  }

  const basePath = this._compiler.sanity.basePath

  if (request.indexOf('config:') === 0) {
    const config = JSON.parse(input)
    const indent = buildEnv === 'production' ? 0 : 2
    const reduced = reduceConfig(config, buildEnv, {studioRootPath: basePath})
    return `module.exports = ${JSON.stringify(reduced, null, indent)}\n`
  }

  if (request === 'sanity:css-custom-properties') {
    const cssCustomProperties = this._compiler.sanity.cssCustomProperties
    const indent = buildEnv === 'production' ? 0 : 2
    return `module.exports = ${JSON.stringify(cssCustomProperties, null, indent)}\n`
  }

  if (request === 'sanity:versions') {
    const versions = getSanityVersions(basePath)
    const indent = buildEnv === 'production' ? 0 : 2
    return `module.exports = ${JSON.stringify(versions, null, indent)}\n`
  }

  const parts = this._compiler.sanity.parts
  const dependencies = parts.plugins.map(plugin => path.join(plugin.path, 'sanity.json'))
  const implementations = (parts.implementations[partName] || []).map(impl => impl.path)

  this.addDependency(path.join(basePath, 'sanity.json'))
  dependencies.forEach(this.addDependency)

  // The debug role needs to return the whole parts tree
  if (partName === 'sanity:debug') {
    const debug = Object.assign({}, parts, {basePath})
    return `module.exports = ${JSON.stringify(debug, null, 2)}\n`
  }

  return loadAll ? multiImplementationHandler(partName, implementations) : input
}

module.exports = sanityPartLoader
