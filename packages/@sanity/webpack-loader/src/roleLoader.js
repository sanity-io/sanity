'use strict'

const path = require('path')
const loaderUtils = require('loader-utils')
const resolver = require('@sanity/resolver')
const multiFulfillerHandler = require('./multiFulfillerHandler')

function sanityRoleLoader(input) {
  const callback = this.async()

  const role = this.data.sanityRole
  const basePath = this.data.basePath

  if (!role) {
    return callback(new Error('`sanityRole` property must be passed to the role loader'))
  }

  if (!basePath) {
    return callback(new Error('`basePath` property must be passed to role loader'))
  }

  this.addDependency(path.join(basePath, 'sanity.json'))

  return resolver
    .resolveRoles({basePath: basePath})
    .then(roles => {
      if (this.cacheable) {
        this.cacheable()
      }

      // Also add plugin manifests as dependencies, as roles and paths may change
      roles.plugins.forEach(plugin => {
        this.addDependency(path.join(plugin.path, 'sanity.json'))
      })

      const loadAll = role.indexOf('all:') === 0
      const roleName = loadAll ? role.substr(4) : role
      const opts = {role: roleName, input, roles}

      if (roleName === 'sanity:debug') {
        return setImmediate(
          callback,
          null,
          `module.exports = ${JSON.stringify(roles, null, 2)}\n`
        )
      }

      return loadAll
        ? setImmediate(multiFulfillerHandler, opts, callback)
        : callback(null, input)
    })
    .catch(err => {
      this.emitWarning(err.message)
      throw err
    })
}

sanityRoleLoader.pitch = function (remaining, preceding, data) {
  if (remaining.indexOf('sanityRole=') === -1) {
    return
  }

  const qs = remaining.substring(remaining.indexOf('?'))
  Object.assign(data, loaderUtils.parseQuery(qs) || {})
}

module.exports = sanityRoleLoader
