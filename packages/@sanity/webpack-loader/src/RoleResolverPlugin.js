'use strict'

const qs = require('querystring')
const roleResolver = require('@sanity/resolver')

const RoleResolverPlugin = function (options) {
  if (!options || !options.basePath) {
    throw new Error(
      '`basePath` option must be specified in role resolver plugin constructor'
    )
  }

  this.apply = resolver => {
    resolver.plugin('module', function (request, callback) {
      if (!request.request.match(/^(all:)?(component|style):/)) {
        callback()
        return
      }

      const sanityRole = request.request.replace(/^all:/, '')

      roleResolver
        .resolveRoles({basePath: options.basePath})
        .then(roles => {
          const role = roles.fulfilled[sanityRole]
          if (request.request.indexOf('all:') !== 0 && !role) {
            return callback(new Error(
              `Role "${sanityRole}" not fulfilled by any plugins`
            ))
          }

          const file = (Array.isArray(role) ? role[0] : role).path

          const reqQuery = (request.query || '').replace(/^\?/, '')
          const query = Object.assign({}, qs.parse(reqQuery) || {}, {
            sanityRole: request.request,
            basePath: options.basePath
          })

          return this.doResolve(['file'], Object.assign({}, request, {
            request: file,
            query: `?${qs.stringify(query)}`
          }), callback)
        })
      .catch(callback)
    })
  }
}

module.exports = RoleResolverPlugin
