'use strict'

const path = require('path')
const loaderUtils = require('loader-utils')
const reduceConfig = require('@sanity/util').reduceConfig
const multiImplementationHandler = require('./multiImplementationHandler')

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_ENV
const env = typeof sanityEnv === 'undefined' ? process.env.NODE_ENV : sanityEnv
/* eslint-enable no-process-env */

function sanityPartLoader(input) {
  this.cacheable()

  const qs = this.resourceQuery.substring(this.resourceQuery.indexOf('?'))
  const request = (loaderUtils.parseQuery(qs) || {}).sanityPart

  const loadAll = request.indexOf('all:') === 0
  const partName = loadAll ? request.substr(4) : request

  // In certain cases (CSS when building statically),
  // a separate compiler instance is triggered
  if (!this._compiler.sanity) {
    return input
  }

  if (request === 'config:sanity') {
    const config = JSON.parse(input)
    const indent = env === 'production' ? 0 : 2
    const reduced = reduceConfig(config, env)
    return `module.exports = ${JSON.stringify(reduced, null, indent)}\n`
  }

  const parts = this._compiler.sanity.parts
  const basePath = this._compiler.sanity.basePath

  const dependencies = parts.plugins.map(plugin => path.join(plugin.path, 'sanity.json'))
  const implementations = (parts.implementations[partName] || []).map(impl => impl.path)

  this.addDependency(path.join(basePath, 'sanity.json'))
  dependencies.forEach(this.addDependency)

  // The debug role needs to return the whole parts tree
  if (partName === 'sanity:debug') {
    return `module.exports = ${JSON.stringify(parts, null, 2)}\n`
  }

  return loadAll
    ? multiImplementationHandler(partName, implementations)
    : input
}

module.exports = sanityPartLoader
