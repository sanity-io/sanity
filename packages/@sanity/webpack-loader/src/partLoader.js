'use strict'

const path = require('path')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const multiImplementationHandler = require('./multiImplementationHandler')

function sanityPartLoader(input) {
  const callback = this.async()

  const part = this.data.sanityPart
  const basePath = this.data.basePath

  if (!part) {
    return callback(new Error('`sanityPart` property must be passed to the part loader'))
  }

  if (!basePath) {
    return callback(new Error('`basePath` property must be passed to part loader'))
  }

  this.addDependency(path.join(basePath, 'sanity.json'))

  return resolver
    .resolveParts({basePath: basePath})
    .then(parts => {
      this.cacheable()

      // Also add plugin manifests as dependencies, as parts and paths may change
      parts.plugins.forEach(plugin => {
        this.addDependency(path.join(plugin.path, 'sanity.json'))
      })

      const loadAll = part.indexOf('all:') === 0
      const partName = loadAll ? part.substr(4) : part
      const opts = {part: partName, input, parts}

      if (partName === 'sanity:debug') {
        return setImmediate(
          callback,
          null,
          `module.exports = ${JSON.stringify(parts, null, 2)}\n`
        )
      }

      return loadAll
        ? setImmediate(multiImplementationHandler, opts, callback)
        : callback(null, input)
    })
    .catch(err => {
      this.emitWarning(err.message)
      throw err
    })
}

sanityPartLoader.pitch = function (remaining, preceding, data) {
  if (remaining.indexOf('sanityPart=') === -1) {
    return
  }

  const qs = remaining.substring(remaining.indexOf('?'))
  Object.assign(data, loaderUtils.parseQuery(qs) || {})
}

module.exports = sanityPartLoader
