'use strict'

const path = require('path')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const serializeError = require('./serializeError')

const banner = '/* This file has been dynamically modified by the Sanity plugin loader */'
const mapBanner = '/* The following role map is dynamically built by the Sanity plugin loader */'
const rolesVarMatcher = /\n(var|let) roles = {'#': '#'}/

function sanityRoleLoader(input) {
  const callback = this.async()
  const query = loaderUtils.parseQuery(this.query)

  if (!query.basePath) {
    callback(new Error('`basePath` property must be passed to role loader'))
    return
  }

  this.addDependency(path.join(query.basePath, 'sanity.json'))

  resolver
    .resolveRoles({basePath: query.basePath})
    .then(roles => {
      if (this.cacheable) {
        this.cacheable()
      }

      // Also add plugin manifests as dependencies
      roles.plugins.forEach(plugin => {
        this.addDependency(path.join(plugin.path, 'sanity.json'))
      })

      const map = Object.keys(roles.fulfilled).reduce((target, role) => {
        if (role.indexOf('style:') !== 0) {
          target[role] = roles.fulfilled[role]
        }

        return target
      }, {})

      const baseMap = JSON.stringify(map, null, 2)

      // { "path": "/some/path" } => { "module": require("/some/path") }
      const pluginMap = baseMap.replace(/"path": "(.*)?"/g, (match, filePath) => {
        const relPath = loaderUtils.stringifyRequest(this, filePath)
        return `"module": require(${relPath})`
      })

      const content = input.replace(
        rolesVarMatcher,
        `${mapBanner}\n$1 roles = ${pluginMap}`
      )

      setImmediate(callback, null, `${banner}\n${content}`)
    })
    .catch(err => {
      this.emitWarning(err.message)
      serializeError(err, callback)
    })
}

module.exports = sanityRoleLoader
