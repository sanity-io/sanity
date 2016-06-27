'use strict'

const qs = require('querystring')
const path = require('path')
const roleResolver = require('@sanity/resolver')
const emptyRole = require.resolve('./emptyRole')
const debugRole = require.resolve('./debugRole')
const unfulfilledRole = require.resolve('./unfulfilledRole')
const roleMatcher = /^(all:)?[a-z]+:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/
const configMatcher = /^config:(@[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/

const isSanityRole = request =>
  roleMatcher.test(request.request) || configMatcher.test(request.request)

const RoleResolverPlugin = function (options) {
  if (!options || !options.basePath) {
    throw new Error(
      '`basePath` option must be specified in role resolver plugin constructor'
    )
  }

  const configPath = path.join(options.basePath, 'config')

  this.apply = resolver => {
    resolver.plugin('module', function (request, callback) {
      // The debug role should return the whole role/plugin tree
      if (request.request === 'sanity:debug') {
        this.doResolve(['file'], {
          request: debugRole,
          query: `?${qs.stringify({
            sanityRole: request.request,
            basePath: options.basePath
          })}`
        }, callback)
        return
      }

      if (!isSanityRole(request)) {
        callback()
        return
      }

      const sanityRole = request.request.replace(/^all:/, '')

      roleResolver
        .resolveRoles({basePath: options.basePath})
        .then(roles => {
          // Configuration files resolve to a specific path
          // Either the root sanity.json or a plugins JSON config
          const configMatch = request.request.match(configMatcher)
          if (configMatch) {
            const configFor = configMatch[1]
            const req = Object.assign({}, request, {
              request: configFor === 'sanity'
                ? path.join(options.basePath, 'sanity.json')
                : path.join(configPath, `${configMatch[1]}.json`)
            })
            return this.doResolve(['file'], req, callback)
          }

          const loadAll = request.request.indexOf('all:') === 0
          const allowUnfulfilled = request.query === '?'

          // Imports throw if they are not fulfilled, except if they
          // are prefixed with `all:` (returns an empty array) or they
          // are postfixed with `?` (returns undefined)
          const role = roles.fulfilled[sanityRole]
          if (!role) {
            if (allowUnfulfilled) {
              return this.doResolve(['file'], {request: unfulfilledRole}, callback)
            }

            if (loadAll) {
              return this.doResolve(['file'], {request: emptyRole}, callback)
            }

            return callback(new Error(
              `Role "${sanityRole}" not fulfilled by any plugins`
            ))
          }

          const reqQuery = (request.query || '').replace(/^\?/, '')
          const query = Object.assign({}, qs.parse(reqQuery) || {}, {
            sanityRole: request.request,
            basePath: options.basePath
          })

          return this.doResolve(['file', 'directory'], Object.assign({}, request, {
            request: role[0].path,
            query: `?${qs.stringify(query)}`
          }), callback)
        })
      .catch(callback)
    })
  }
}

module.exports = RoleResolverPlugin
