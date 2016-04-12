'use strict'

const qs = require('querystring')
const roleResolver = require('@sanity/resolver')
const emptyRole = require.resolve('./emptyRole')
const roleMatcher = /^(all:)?[a-z]+:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/

const RoleResolverPlugin = function (options) {
  if (!options || !options.basePath) {
    throw new Error(
      '`basePath` option must be specified in role resolver plugin constructor'
    )
  }

  this.apply = resolver => {
    resolver.plugin('module', function (request, callback) {
      if (!roleMatcher.test(request.request)) {
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
          } else if (!role) {
            return this.doResolve(['file'], {request: emptyRole}, callback)
          }

          const reqQuery = (request.query || '').replace(/^\?/, '')
          const query = Object.assign({}, qs.parse(reqQuery) || {}, {
            sanityRole: request.request,
            basePath: options.basePath
          })

          return this.doResolve(['file'], Object.assign({}, request, {
            request: role[0].path,
            query: `?${qs.stringify(query)}`
          }), callback)
        })
      .catch(callback)
    })
  }
}

module.exports = RoleResolverPlugin
