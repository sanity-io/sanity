import fsp from 'fs-promise'
import path from 'path'
import uniq from 'lodash/uniq'
import promiseProps from 'promise-props-recursive'
import validateManifest from './validateManifest'

export default function resolveTree(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  return readManifest(options)
    .then(manifest => resolvePlugins(manifest.plugins || [], options))
    .then(plugins => plugins.reduce(flattenTree, plugins.slice()))
}

export function resolveRoles(options = {}) {
  return resolveTree(options)
    .then(plugins => {
      const result = {provided: {}, fulfilled: {}, plugins}

      result.provided = plugins.reduceRight(assignRoles, result.provided)
      result.fulfilled = plugins.reduceRight(
        (fulfilled, plugin) => reduceRoles(fulfilled, plugin, result)
      , result.fulfilled)

      return result
    })
}

function assignRoles(provided, plugin) {
  (plugin.manifest.provides || []).forEach(provider => {
    const existingProvider = provided[provider.role]
    if (!existingProvider) {
      provided[provider.role] = {
        plugin: plugin.name,
        path: plugin.path,
        multi: Boolean(provider.multiple)
      }
    } else if (existingProvider.multi !== Boolean(provider.multiple)) {
      const existing = `"${existingProvider.plugin}" (${existingProvider.path})`
      const current = `"${plugin.name}" (${plugin.path})`
      const base = `Plugins ${existing} and "${current} both provide ${provider.role}"`
      throw new Error(`${base}, but expects different shape (single vs multiple fulfillers)`)
    }
  })

  return provided
}

function reduceRoles(fulfilled, plugin, roles) {
  [].concat(
    plugin.manifest.fulfills,
    plugin.manifest.provides
  ).filter(Boolean).forEach(fulfiller => {
    const role = fulfiller.role
    const provided = roles.provided[role]
    const isLib = plugin.path.split(path.sep).indexOf('node_modules') !== -1
    const rolePath = isLib ? fulfiller.path : (fulfiller.srcPath || fulfiller.path)

    if (!rolePath) {
      return
    }

    const details = {
      plugin: plugin.name,
      path: path.resolve(path.join(plugin.path, rolePath))
    }

    if (provided && provided.multi) {
      fulfilled[role] = fulfilled[role] || []
      fulfilled[role].push(details)
    } else if (provided && !fulfilled[role]) {
      fulfilled[role] = details
    }
  })

  return fulfilled
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
      } else if (err.name === 'ValidationError') {
        err.message = `Error while reading "${options.plugin}" manifest:\n${err.message}`
      }

      throw err
    })
}

function resolvePluginPath(plugin) {
  const pluginDir = plugin.name[0] === '@' ? plugin.name : `sanity-plugin-${plugin.name}`

  let locations = [
    path.join(plugin.basePath, 'plugins', pluginDir),
    path.join(plugin.basePath, 'plugins', plugin.name),
    path.join(plugin.basePath, 'node_modules', pluginDir)
  ]

  if (plugin.parentPluginPath) {
    locations.splice(2, 0, path.join(plugin.parentPluginPath, 'node_modules', pluginDir))
  }

  locations = uniq(locations)

  return Promise.all(locations.map(forgiveNonExistance))
    .then(matches => matches.findIndex(Boolean))
    .then(index => {
      if (index === -1) {
        const err = new Error([
          `Plugin "${plugin.name}" not found.\n`,
          'Locations tried:\n  * ',
          locations.join('\n  * ')
        ].join(''))

        err.plugin = plugin.name
        err.locations = locations

        throw err
      }

      return locations[index]
    })
}

function forgiveNonExistance(location) {
  return fsp.stat(location).catch(() => false)
}
