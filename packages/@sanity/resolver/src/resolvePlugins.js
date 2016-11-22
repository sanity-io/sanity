import path from 'path'
import pathExists from 'path-exists'
import uniq from 'lodash.uniq'
import readManifest from './readManifest'
import promiseProps from 'promise-props-recursive'

export function resolvePlugin(options) {
  const {name, basePath, parentPluginPath, sync} = options
  const plugin = {name}
  const manifestDir = resolvePluginPath({name, basePath, parentPluginPath}, sync)

  if (sync) {
    const manifest = readManifest({
      sync,
      basePath,
      manifestDir,
      plugin: name
    })

    return {
      name,
      manifest,
      path: manifestDir,
      plugins: resolvePlugins(manifest.plugins || [], {
        sync,
        basePath,
        parentPluginPath: manifestDir
      })
    }
  }

  return manifestDir
    .then(resolvedPath => Object.assign(plugin, {path: resolvedPath}))
    .then(() => readManifest({basePath, manifestDir: plugin.path, plugin: name}))
    .then(manifest => promiseProps(Object.assign(plugin, {
      manifest,
      plugins: resolvePlugins(manifest.plugins || [], {
        basePath,
        parentPluginPath: plugin.path
      })
    })))
}

export function resolvePlugins(pluginNames, options) {
  const plugins = pluginNames.map(pluginName =>
    resolvePlugin(Object.assign({name: pluginName}, options))
  )

  return options.sync ? plugins : Promise.all(plugins)
}

function resolvePluginPath(plugin, sync) {
  const pluginDir = plugin.name[0] === '@'
    ? plugin.name
    : `sanity-plugin-${plugin.name}`

  let locations = [
    path.join(plugin.basePath, 'plugins', pluginDir),
    path.join(plugin.basePath, 'plugins', plugin.name),
    path.join(plugin.basePath, 'node_modules', pluginDir)
  ]

  if (plugin.parentPluginPath) {
    locations.splice(2, 0, path.join(plugin.parentPluginPath, 'node_modules', pluginDir))
  }

  let currentDir = plugin.basePath
  while (path.dirname(currentDir) !== currentDir) {
    currentDir = path.dirname(currentDir)
    locations.push(path.join(currentDir, 'node_modules', pluginDir))
  }

  locations = uniq(locations)

  if (sync) {
    const location = locations.find(pathExists.sync)
    if (!location) {
      throw getPluginNotFoundError(plugin.name, locations)
    }

    return location
  }

  return Promise.all(locations.map(pathExists))
    .then(matches => matches.findIndex(Boolean))
    .then(index => {
      if (index === -1) {
        throw getPluginNotFoundError(plugin.name, locations)
      }

      return locations[index]
    })
}

function getPluginNotFoundError(pluginName, locations) {
  const err = new Error([
    `Plugin "${pluginName}" not found.\n`,
    'Locations tried:\n  * ',
    locations.join('\n  * ')
  ].join(''))

  err.plugin = pluginName
  err.locations = locations

  return err
}
