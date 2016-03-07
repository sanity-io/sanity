/* eslint-env node */
const path = require('path')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const serializeError = require('./serialize-error')

const banner = '/* This file has been dynamically modified by the Sanity plugin loader */'
const mapBanner = '/* The following role map is dynamically built by the Sanity plugin loader */'
const rolesVarMatcher = /\n(var|let) roles = {'#': '#'}/

module.exports = function sanityPluginLoader(input) {
  const callback = this.async()
  const query = loaderUtils.parseQuery(this.query)

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

      const baseMap = JSON.stringify(roles.fulfilled, null, 2)

      // { "path": "/some/path" } => { "module": require("/some/path") }
      const pluginMap = baseMap.replace(/"path": "(.*)?"/g, '"module": require("$1")')

      const content = input.replace(
        rolesVarMatcher,
        `${mapBanner}\n$1 roles = ${pluginMap}`
      )

      callback(null, `${banner}\n${content}`)
    })
    .catch(err => {
      this.emitWarning(err.message)
      callback(null, serializeError(err))
    })
}
