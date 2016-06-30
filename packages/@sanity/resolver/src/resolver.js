import flattenTree from './flattenTree'
import readManifest from './readManifest'
import resolvePlugins from './resolvePlugins'
import assignFulfillers from './assignFulfillers'
import assignDefinitions from './assignDefinitions'
import resolveProjectRoot from './resolveProjectRoot'

export default function resolveTree(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  if (options.resolveProjectRoot) {
    // @todo Sync vs async
    const resolveOpts = Object.assign({}, options, {sync: true})
    options.basePath = resolveProjectRoot(resolveOpts)
  }

  let projectManifest = null

  if (options.sync) {
    return resolveTreeSync(options)
  }

  return readManifest(options)
    .then(manifest => {
      projectManifest = manifest
      return resolvePlugins(manifest.plugins || [], options)
    })
    .then(plugins => plugins.concat([getProjectRootPlugin(options.basePath, projectManifest)]))
    .then(plugins => plugins.reduce(flattenTree, plugins.slice()))
}

export function resolveRoles(options = {}) {
  if (options.sync) {
    return mergeResult(resolveTree(options), options)
  }

  return resolveTree(options).then(plugins => mergeResult(plugins, options))
}

export {default as resolveProjectRoot} from './resolveProjectRoot'

function resolveTreeSync(options) {
  const basePath = options.basePath || process.cwd()
  const manifest = readManifest(options)
  const plugins = resolvePlugins(manifest.plugins || [], options)
    .concat([getProjectRootPlugin(basePath, manifest)])

  return plugins.reduce(flattenTree, plugins.slice())
}

function getProjectRootPlugin(basePath, manifest) {
  return {
    name: '(project root)',
    path: basePath,
    manifest: manifest,
    plugins: []
  }
}

function mergeResult(plugins, options = {}) {
  const result = {definitions: {}, fulfilled: {}, plugins}

  result.definitions = plugins.reduceRight(assignDefinitions, result.definitions)
  result.fulfilled = plugins.reduceRight(
    (fulfilled, plugin) => assignFulfillers(fulfilled, plugin, result, options),
    result.fulfilled
  )

  return result
}
