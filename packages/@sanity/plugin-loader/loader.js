const path = require('path')
const util = require('util')
const Module = require('module')
const interopRequire = require('interop-require')
const resolver = require('@sanity/resolver')

const configMatcher = /^config:(@[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/
const resolveRoles = resolver.resolveRoles
const defaultResult = {
  definitions: {},
  fulfilled: {},
  plugins: []
}

function registerLoader(options) {
  if (!options) {
    throw new Error('`registerLoader()` requires an options object')
  }

  // Resolve actual roles only if basePath is set,
  // otherwise use empty defaults
  const roles = options.basePath
    ? resolveRoles({basePath: options.basePath, sync: true})
    : Object.assign({}, defaultResult)

  // Configuration files are loaded with a custom prefix
  const configPath = path.join(
    options.basePath || process.cwd(),
    'config'
  )

  // Turn {"roleName": [{path: "/foo/bar.js"}]} into {"roleName": ["/foo/bar.js"]}
  roles.fulfilled = Object.keys(roles.fulfilled).reduce((fulfillers, role) => {
    fulfillers[role] = roles.fulfilled[role].map(impl => impl.path)
    return fulfillers
  }, {})

  // Allow passing specific overrides for roles
  const overrides = options.overrides
  if (overrides) {
    Object.keys(overrides).forEach(role => {
      if (!Array.isArray(overrides[role])) {
        throw new Error(`Override for role '${role}' is not an array`)
      }
    })

    roles.fulfilled = Object.assign(
      roles.fulfilled,
      overrides
    )
  }

  const realResolve = Module._resolveFilename;
  Module._resolveFilename = (request, parent) => {
    // `sanity:debug` returns the whole resolve result
    if (request === 'sanity:debug') {
      require.cache['sanity:debug'] = getModule('sanity:debug', roles)
      return request
    }

    const configMatch = request.match(configMatcher)
    if (configMatch) {
      const configFor = configMatch[1]
      return configFor === 'sanity'
        ? path.join(options.basePath, 'sanity.json')
        : path.join(configPath, `${configFor}.json`)
    }

    // Should we load all the fulfillers or just a single one
    const loadAll = request.indexOf('all:') === 0
    const roleName = request.replace(/^all:/, '')

    // If we're loading all the fulfillers of a role, we can't point to
    // one single file - instead we need to manually "construct" a module
    // consisting of an array which holds all the fulfillers, then add it
    // to the require cache
    if (loadAll) {
      const implementers = roles.fulfilled[roleName]

      // Overrides should be plain objects, not paths to modules
      // Actual resolved roles are paths to fulfillers
      const fulfillers = overrides && overrides[roleName]
        ? implementers
        : implementers.map(interopRequire)

      require.cache[request] = getModule(request, fulfillers)
      return request
    }

    // If we have no fulfillers of the role, fall back to the default resolver
    // Note that `all:`-requests should return an empty array, not throw
    if (!roles.fulfilled[request]) {
      return realResolve(request, parent)
    }

    // "Most significant"-imports can be directly resolved to their fulfiller,
    // HOWEVER; overwritten implementations needs to be put into cache
    const override = overrides && overrides[request]
    if (override) {
      require.cache[request] = getModule(request, override[0])
      return request
    }

    return roles.fulfilled[request][0]
  }
}

function getModule(request, moduleExports) {
  return {
    id: request,
    filename: request,
    exports: moduleExports,
    parent: null,
    loaded: true
  }
}

module.exports = registerLoader
