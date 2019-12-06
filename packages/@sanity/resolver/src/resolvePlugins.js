import fs from 'fs'
import path from 'path'
import {uniq} from 'lodash'
import pathExists from 'path-exists'
import readManifest from './readManifest'
import promiseProps from 'promise-props-recursive'

const dirMatcher = /^\.\.?[/\\]?/

export function resolvePlugins(pluginNames, options) {
  const plugins = pluginNames.map(pluginName => {
    return resolvePlugin(Object.assign({name: pluginName}, options))
  })

  return options.sync ? plugins : Promise.all(plugins)
}

export function resolvePlugin(options) {
  const {name, basePath, parentPluginPath, sync, env} = options
  const resolver = sync ? dir => dir : dir => Promise.resolve(dir)
  const parentDir = parentPluginPath || basePath
  const isDirPlugin = dirMatcher.test(name)

  const pluginName = isDirPlugin ? readPluginName(parentDir, name) : name

  if (sync) {
    const manifestDir = isDirPlugin
      ? resolver(path.resolve(parentDir, name))
      : resolvePluginPath({name, basePath, parentPluginPath}, sync)

    const manifest = readManifest({
      sync,
      basePath,
      manifestDir,
      plugin: pluginName
    })

    return {
      name: pluginName,
      manifest,
      path: manifestDir,
      plugins: resolvePlugins(manifest.plugins || [], {
        env,
        sync,
        basePath,
        parentPluginPath: manifestDir
      })
    }
  }

  const dirResolver = Promise.resolve(
    isDirPlugin
      ? resolver(path.resolve(parentDir, name))
      : resolvePluginPath({name, basePath, parentPluginPath}, sync)
  )

  return dirResolver.then(manifestDir => {
    const plugin = {name: pluginName, path: manifestDir}
    return readManifest({basePath, manifestDir: plugin.path, plugin: pluginName, env}).then(
      manifest =>
        promiseProps(
          Object.assign(plugin, {
            manifest,
            plugins: resolvePlugins(manifest.plugins || [], {
              env,
              basePath,
              parentPluginPath: plugin.path
            })
          })
        )
    )
  })
}

function resolvePluginPath(plugin, sync) {
  const pluginDir = plugin.name[0] === '@' ? plugin.name : `sanity-plugin-${plugin.name}`

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
  const err = new Error(
    [
      `Plugin "${pluginName}" not found.\n`,
      'Locations tried:\n  * ',
      locations.join('\n  * ')
    ].join('')
  )

  err.code = 'PluginNotFound'
  err.plugin = pluginName
  err.locations = locations

  return err
}

function readPluginName(parent, dir) {
  const pkgPath = path.join(parent, dir, 'package.json')
  const manifestPath = path.join(parent, dir, 'sanity.json')
  const baseError = `Plugin/project at "${parent}" has the path "${dir}" as a plugin, but Sanity was not able to load`
  const info = {}
  try {
    info.name = readJson(pkgPath).name.replace(/^sanity-plugin-/, '')
  } catch (err) {
    throw new Error(`${baseError} "${pkgPath}" in order to get the plugin name`)
  }

  try {
    info.manifest = readJson(manifestPath)
  } catch (err) {
    throw new Error(`${baseError} "${manifestPath}" in order to get the plugin parts`)
  }

  return info.name
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, {encoding: 'utf8'}))
}
