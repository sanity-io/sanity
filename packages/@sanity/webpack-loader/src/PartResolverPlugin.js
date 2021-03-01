const qs = require('querystring')
const path = require('path')
const partResolver = require('@sanity/resolver')

const emptyPart = require.resolve('./emptyPart')
const debugPart = require.resolve('./debugPart')
const unimplementedPart = require.resolve('./unimplementedPart')
const partMatcher = /^(all:)?part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/
const configMatcher = /^config:(@?[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/
const sanityMatcher = /^sanity:/
const target = 'resolve'

const isSanityPart = (request) =>
  [partMatcher, configMatcher, sanityMatcher].some((match) => match.test(request.request))

const PartResolverPlugin = function (options) {
  if (!options || !options.basePath) {
    throw new Error('`basePath` option must be specified in part resolver plugin constructor')
  }

  this.environment = options.env
  this.basePath = options.basePath
  this.additionalPlugins = options.additionalPlugins || []
  this.configPath = path.join(this.basePath, 'config')
  this.extractCssCustomProperties = options.extractCssCustomProperties
  this.isSanityMonorepo = options.isSanityMonorepo
}

PartResolverPlugin.prototype.apply = function (compiler) {
  const env = this.environment
  const basePath = this.basePath
  const additionalPlugins = this.additionalPlugins
  const configPath = this.configPath
  const isSanityMonorepo = this.isSanityMonorepo
  const extractCssCustomProperties = this.extractCssCustomProperties

  compiler.plugin('watch-run', (watcher, cb) => {
    cacheParts(watcher).then(resolveCssCustomProperties).then(cb).catch(cb)
  })

  compiler.plugin('run', (params, cb) => {
    cacheParts(params).then(resolveCssCustomProperties).then(cb).catch(cb)
  })

  function cacheParts(params) {
    const instance = params.compiler || params
    instance.sanity = compiler.sanity || {basePath: basePath}
    return partResolver
      .resolveParts({env, basePath, additionalPlugins, isSanityMonorepo})
      .then((parts) => {
        instance.sanity.parts = parts
        return {instance, parts}
      })
  }

  function resolveCssCustomProperties({instance, parts}) {
    const impl = parts.implementations['part:@sanity/base/theme/variables-style']
    if (!impl || !impl[0] || !extractCssCustomProperties) {
      return Promise.resolve()
    }

    return extractCssCustomProperties(basePath, impl[0].path, isSanityMonorepo).then(
      (cssCustomProperties) => {
        instance.sanity.cssCustomProperties = cssCustomProperties
      }
    )
  }

  compiler.plugin('compilation', () => {
    // eslint-disable-next-line complexity
    compiler.resolvers.normal.plugin('module', function (request, callback) {
      // If it doesn't match the string pattern of a Sanity part, stop trying to resolve it
      if (!isSanityPart(request)) {
        return callback()
      }

      const parts = compiler.sanity.parts
      const sanityPart = request.request.replace(/^all:/, '')

      if (request.request === 'sanity:css-custom-properties') {
        return this.doResolve(
          target,
          getResolveOptions({
            resolveTo: debugPart,
            request: request,
          }),
          null,
          callback
        )
      }

      // The debug part should return the whole part/plugin tree
      if (request.request === 'sanity:debug') {
        return this.doResolve(
          target,
          getResolveOptions({
            resolveTo: debugPart,
            request: request,
          }),
          null,
          callback
        )
      }

      // The versions part should return a list of module versions
      if (request.request === 'sanity:versions') {
        return this.doResolve(
          target,
          getResolveOptions({
            resolveTo: debugPart,
            request: request,
          }),
          null,
          callback
        )
      }

      // Configuration files resolve to a specific path
      // Either the root sanity.json or a plugins JSON config
      const configMatch = request.request.match(configMatcher)
      if (configMatch) {
        const configFor = configMatch[1]
        const req = Object.assign({}, request, {
          request:
            configFor === 'sanity'
              ? path.join(basePath, 'sanity.json')
              : path.join(configPath, `${configFor}.json`),
        })

        req.query = `?${qs.stringify({sanityPart: request.request})}`
        return this.doResolve(target, req, null, callback)
      }

      const loadAll = request.request.indexOf('all:') === 0
      const allowUnimplemented = request.query === '?'
      const part = parts.implementations[sanityPart]

      // Imports throw if they are not implemented, except if they
      // are prefixed with `all:` (returns an empty array) or they
      // are postfixed with `?` (returns undefined)
      if (!part) {
        if (allowUnimplemented) {
          return this.doResolve(
            target,
            {request: unimplementedPart, path: unimplementedPart},
            null,
            callback
          )
        }

        if (loadAll) {
          return this.doResolve(target, {request: emptyPart, path: emptyPart}, null, callback)
        }

        return callback(new Error(`Part "${sanityPart}" not implemented by any plugins`))
      }

      const resolveOpts = getResolveOptions({
        resolveTo: part[0].path,
        request: request,
      })

      return this.doResolve(target, resolveOpts, null, callback)
    })
  })
}

function getResolveOptions(options) {
  const reqQuery = (options.request.query || '').replace(/^\?/, '')
  const query = Object.assign({}, qs.parse(reqQuery) || {}, {
    sanityPart: options.request.request,
  })

  return Object.assign({}, options.request, {
    request: options.resolveTo,
    query: `?${qs.stringify(query)}`,
  })
}

module.exports = PartResolverPlugin
