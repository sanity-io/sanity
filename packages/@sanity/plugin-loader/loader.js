const path = require('path')
const Module = require('module')
const interopRequire = require('interop-require')
const cssHook = require('css-modules-require-hook')
const resolver = require('@sanity/resolver')
const reduceConfig = require('@sanity/util').reduceConfig

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_ENV
const env = typeof sanityEnv === 'undefined' ? process.env.NODE_ENV : sanityEnv
/* eslint-enable no-process-env */

const configMatcher = /^config:(@[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/
const resolveParts = resolver.resolveParts
const defaultResult = {
  definitions: {},
  implementations: {},
  plugins: []
}

function registerLoader(options) {
  if (!options) {
    throw new Error('`registerLoader()` requires an options object')
  }

  // Resolve actual parts only if basePath is set,
  // otherwise use empty defaults
  const parts = options.basePath
    ? resolveParts({basePath: options.basePath, sync: true})
    : Object.assign({}, defaultResult)

  // Configuration files are loaded with a custom prefix
  const configPath = path.join(
    options.basePath || process.cwd(),
    'config'
  )

  // Turn {"partName": [{path: "/foo/bar.js"}]} into {"partName": ["/foo/bar.js"]}
  parts.implementations = Object.keys(parts.implementations).reduce((implementations, part) => {
    implementations[part] = parts.implementations[part].map(impl => impl.path)
    return implementations
  }, {})

  // Allow passing specific overrides for parts
  const overrides = options.overrides
  if (overrides) {
    Object.keys(overrides).forEach(part => {
      if (!Array.isArray(overrides[part])) {
        throw new Error(`Override for part '${part}' is not an array`)
      }
    })

    parts.implementations = Object.assign(
      parts.implementations,
      overrides
    )
  }

  const realResolve = Module._resolveFilename
  Module._resolveFilename = (request, parent) => {
    // `sanity:debug` returns the whole resolve result
    if (request === 'sanity:debug') {
      require.cache['sanity:debug'] = getModule('sanity:debug', parts)
      return request
    }

    const configMatch = request.match(configMatcher)
    if (configMatch) {
      const configFor = configMatch[1]
      if (configFor === 'sanity') {
        const sanityConfig = require(path.join(options.basePath, 'sanity.json'))
        require.cache[request] = getModule(request, reduceConfig(sanityConfig, env))
        return request
      }

      return path.join(configPath, `${configFor}.json`)
    }

    // Should we load all the implementations or just a single one
    const loadAll = request.indexOf('all:') === 0
    const partName = request.replace(/^all:/, '').replace(/\?$/, '')
    const allowUnimplemented = request.match(/\?$/)

    // If we're loading all the implementations of a part, we can't point to
    // one single file - instead we need to manually "construct" a module
    // consisting of an array which holds all the implementations, then add it
    // to the require cache
    if (loadAll) {
      const implementers = parts.implementations[partName]

      // Overrides should be plain objects, not paths to modules
      // Actual resolved parts are paths to implementations
      const implementations = overrides && overrides[partName]
        ? implementers
        : implementers.map(interopRequire)

      require.cache[request] = getModule(request, implementations)
      return request
    }

    // If we have no implementations of the part, fall back to the default resolver
    // Note that `all:`-requests should return an empty array, not throw
    if (!parts.implementations[partName]) {
      // If using the "allow unimplemented" (?)-postfix, we want to return undefined
      if (allowUnimplemented) {
        require.cache[request] = getModule(request, undefined)
        return request
      }

      return realResolve(request, parent)
    }

    // "Most significant"-imports can be directly resolved to their implementation,
    // HOWEVER; overwritten implementations needs to be put into cache
    const override = overrides && overrides[partName]
    if (override) {
      require.cache[request] = getModule(request, override[0])
      return request
    }

    return parts.implementations[partName][0]
  }

  // Register CSS hook
  cssHook({
    generateScopedName: options.generateScopedName || '[name]__[local]___[hash:base64:5]'
  })
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
