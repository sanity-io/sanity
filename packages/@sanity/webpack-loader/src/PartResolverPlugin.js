'use strict'

const qs = require('querystring')
const path = require('path')
const partResolver = require('@sanity/resolver')
const emptyPart = require.resolve('./emptyPart')
const debugPart = require.resolve('./debugPart')
const unimplementedPart = require.resolve('./unimplementedPart')
const partMatcher = /^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/
const configMatcher = /^config:(@[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/

const isSanityPart = request =>
  partMatcher.test(request.request) || configMatcher.test(request.request)

const PartResolverPlugin = function (options) {
  if (!options || !options.basePath) {
    throw new Error(
      '`basePath` option must be specified in part resolver plugin constructor'
    )
  }

  const configPath = path.join(options.basePath, 'config')

  this.apply = resolver => {
    resolver.plugin('module', function (request, callback) {
      // The debug part should return the whole part/plugin tree
      if (request.request === 'sanity:debug') {
        this.doResolve(['file'], {
          request: debugPart,
          query: `?${qs.stringify({
            sanityPart: request.request,
            basePath: options.basePath
          })}`
        }, callback)
        return
      }

      if (!isSanityPart(request)) {
        callback()
        return
      }

      const sanityPart = request.request.replace(/^all:/, '')

      partResolver
        .resolveParts({basePath: options.basePath})
        .then(parts => {
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
          const allowUnimplemented = request.query === '?'

          // Imports throw if they are not implemented, except if they
          // are prefixed with `all:` (returns an empty array) or they
          // are postfixed with `?` (returns undefined)
          const part = parts.implementations[sanityPart]
          if (!part) {
            if (allowUnimplemented) {
              return this.doResolve(['file'], {request: unimplementedPart}, callback)
            }

            if (loadAll) {
              return this.doResolve(['file'], {request: emptyPart}, callback)
            }

            return callback(new Error(
              `Part "${sanityPart}" not implemented by any plugins`
            ))
          }

          const reqQuery = (request.query || '').replace(/^\?/, '')
          const query = Object.assign({}, qs.parse(reqQuery) || {}, {
            sanityPart: request.request,
            basePath: options.basePath
          })

          return this.doResolve(['file', 'directory'], Object.assign({}, request, {
            request: part[0].path,
            query: `?${qs.stringify(query)}`
          }), callback)
        })
      .catch(callback)
    })
  }
}

module.exports = PartResolverPlugin
