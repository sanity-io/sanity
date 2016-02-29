import fsp from 'fs-promise'
import path from 'path'
import promiseProps from 'promise-props-recursive'
import validateManifest from './validateManifest'

export default function resolveTree(options = {}) {
  const basePath = options.basePath || process.cwd()
  return readManifest(options)
    .then(manifest => resolvePlugins(manifest.plugins || [], {basePath}))
    .then(plugins => plugins.reduce(flattenTree, plugins.slice()))
}

function flattenTree(target, plugin, index) {
  if (!plugin.plugins && plugin.plugins.length) {
    return target
  }

  const children = plugin.plugins.reduce(flattenTree, plugin.plugins)
  const newTarget = target.slice()
  Array.prototype.splice.apply(newTarget, [target.indexOf(plugin), 0].concat(children))

  return newTarget
}

function resolvePlugin({name, basePath, parentPluginPath}) {
  const plugin = {name}

  return resolvePluginPath({basePath, name, parentPluginPath})
    .then(pluginPath => Object.assign(plugin, {path: pluginPath}))
    .then(() => readManifest({basePath, manifestDir: plugin.path, plugin: name}))
    .then(manifest => promiseProps(Object.assign(plugin, {
      manifest,
      plugins: resolvePlugins(manifest.plugins || [], {
        basePath,
        parentPluginPath: plugin.path
      })
    })))
}

function resolvePlugins(pluginNames, options) {
  return Promise.all(
    pluginNames.map(
      pluginName => resolvePlugin(
        Object.assign({name: pluginName}, options)
      )
    )
  )
}

function readManifest(options = {}) {
  const basePath = options.basePath || process.cwd()
  const manifestPath = path.join(options.manifestDir || basePath, 'sanity.json')

  return fsp.readJson(manifestPath)
    .then(validateManifest)
    .catch(err => {
      if (err.code === 'ENOENT' && options.plugin) {
        throw new Error(`No "sanity.json" file found in plugin "${options.plugin}"`)
      }

      throw err
    })
}

function resolvePluginPath(plugin) {
  const pluginDir = plugin.name[0] === '@' ? plugin.name : `sanity-plugin-${plugin.name}`
  const locations = [
    path.join(plugin.basePath, 'plugins', pluginDir),
    path.join(plugin.basePath, 'plugins', plugin.name),
    path.join(plugin.basePath, 'node_modules', pluginDir)
  ]

  if (plugin.parentPluginPath) {
    locations.splice(2, 0, path.join(plugin.parentPluginPath, 'node_modules', pluginDir))
  }

  return Promise.all(locations.map(forgiveNonExistance))
    .then(matches => matches.findIndex(Boolean))
    .then(index => {
      if (index === -1) {
        throw new Error([
          `Plugin "${plugin.name}" not found.\n`,
          'Locations tried:\n  * ',
          locations.join('\n  * ')
        ].join(''))
      }

      return locations[index]
    })
}

function forgiveNonExistance(location) {
  return fsp.stat(location).catch(() => false)
}
