/* eslint-disable complexity */
const path = require('path')
const Module = require('module')
const interopRequire = require('interop-require')
const cssHook = require('css-modules-require-hook')
const resolver = require('@sanity/resolver')
const util = require('@sanity/util')

const reduceConfig = util.reduceConfig
const getSanityVersions = util.getSanityVersions

/* eslint-disable no-process-env */
const sanityEnv = process.env.SANITY_INTERNAL_ENV
const env = typeof sanityEnv === 'undefined' ? process.env.NODE_ENV : sanityEnv
/* eslint-enable no-process-env */

const configMatcher = /^config:(@?[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+|[A-Za-z0-9_-]+)$/
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

  const basePath = options.basePath || process.cwd()

  // Resolve actual parts only if basePath is set,
  // otherwise use empty defaults
  const parts = options.basePath
    ? resolveParts({basePath, sync: true})
    : Object.assign({}, defaultResult)

  // Configuration files are loaded with a custom prefix
  const configPath = path.join(basePath, 'config')

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

    parts.implementations = Object.assign(parts.implementations, overrides)
  }

  // Keep track of used requires
  const usedImports = new Set()

  const realResolve = Module._resolveFilename

  // eslint-disable-next-line max-statements
  Module._resolveFilename = (request, parent) => {
    // Keep track of the used imports so we can remove them from cache when unregistering
    if (
      request.startsWith('sanity:') ||
      request.startsWith('all:') ||
      request.startsWith('part:') ||
      request.startsWith('config:')
    ) {
      usedImports.add(request)
    }

    // `sanity:debug` returns the whole resolve result
    if (request === 'sanity:debug') {
      const debug = Object.assign({}, parts, {basePath})
      require.cache[request] = getModule(request, debug)
      return request
    }

    if (request === 'sanity:versions') {
      const versions = getSanityVersions(basePath)
      require.cache[request] = getModule(request, versions)
      return request
    }

    if (request === 'sanity:css-custom-properties') {
      // postcss-import doesn't support synchronous operation which we
      // would need to actually resolve these values
      require.cache[request] = getModule(request, {})
      return request
    }

    const configMatch = request.match(configMatcher)
    if (configMatch) {
      const configOverrides = overrides && overrides[request]
      if (configOverrides && configOverrides.length > 0) {
        require.cache[request] = getModule(request, configOverrides[0])
        return request
      }

      const configFor = configMatch[1]
      if (configFor === 'sanity') {
        // eslint-disable-next-line import/no-dynamic-require
        const sanityConfig = require(path.join(basePath, 'sanity.json'))
        require.cache[request] = getModule(
          request,
          reduceConfig(sanityConfig, env, {
            studioRootPath: basePath
          })
        )
        return request
      }

      const pluginConfigPath = path.join(configPath, `${configFor}.json`)
      usedImports.add(pluginConfigPath)
      return pluginConfigPath
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
      const implementers = parts.implementations[partName] || []

      // Overrides should be plain objects, not paths to modules
      // Actual resolved parts are paths to implementations
      const implementations =
        overrides && overrides[partName] ? implementers : implementers.map(interopRequire)

      require.cache[request] = getModule(request, implementations.reverse())
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

      // Strip any query string stuff
      const pathRequest = request.replace(/\?[^\/]*/g, '')

      if (!options.allowLocalDependencies) {
        return realResolve(pathRequest, parent)
      }

      try {
        return realResolve(pathRequest, parent)
      } catch (err) {
        /* intentional noop */
      }

      // Attempt local resolve
      try {
        return realResolve(pathRequest, module.parent)
      } catch (deepErr) {
        return undefined
      }
    }

    // "Most significant"-imports can be directly resolved to their implementation,
    // HOWEVER; overwritten implementations needs to be put into cache
    const override = overrides && overrides[partName]
    if (override) {
      require.cache[request] = getModule(request, override[0])
      return request
    }

    const partPath = parts.implementations[partName][0]
    const resolvedPath = require.resolve(partPath)
    usedImports.add(resolvedPath)
    return resolvedPath
  }

  // Register CSS hook
  const prevCssExtension = require.extensions['.css']
  if (options.stubCss) {
    require.extensions['.css'] = function stubCssHook(mod, filename) {
      return mod._compile(`module.exports = {} `, filename)
    }
  } else {
    const postcss = require('@sanity/webpack-integration/v3')
    cssHook({
      generateScopedName: options.generateScopedName || '[name]__[local]___[hash:base64:5]',
      prepend: postcss
        .getPostcssPlugins({basePath: basePath})
        .filter(plugin => plugin.postcssPlugin !== 'postcss-import')
    })
  }

  return function restore() {
    Module._resolveFilename = realResolve
    require.extensions['.css'] = prevCssExtension
    Object.keys(require.cache)
      .filter(request => request.endsWith('.css'))
      .forEach(request => delete require.cache[request])

    usedImports.forEach(request => delete require.cache[request])
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
