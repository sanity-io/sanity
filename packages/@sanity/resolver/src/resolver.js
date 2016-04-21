import fsp from 'fs-promise'
import path from 'path'
import uniq from 'lodash/uniq'
import promiseProps from 'promise-props-recursive'
import validateManifest from './validateManifest'

export default function resolveTree(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)
  let projectManifest = null

  return readManifest(options)
    .then(manifest => {
      projectManifest = manifest
      return resolvePlugins(manifest.plugins || [], options)
    })
    .then(plugins =>
      [{
        name: '(project root)',
        path: process.cwd(),
        manifest: projectManifest,
        plugins: []
      }].concat(plugins)
    )
    .then(plugins => plugins.reduce(flattenTree, plugins.slice()))
}

export function resolveRoles(options = {}) {
  return resolveTree(options)
    .then(plugins => {
      const result = {definitions: {}, fulfilled: {}, plugins}

      result.definitions = plugins.reduceRight(assignDefinitions, result.definitions)
      result.fulfilled = plugins.reduceRight(
        (fulfilled, plugin) => assignFulfillers(fulfilled, plugin, result),
        result.fulfilled
      )

      return result
    })
}

function assignDefinitions(definitions, plugin) {
  (plugin.manifest.roles || []).forEach(role => {
    if (!role.name) {
      return
    }

    const existingDefinition = definitions[role.name]
    if (existingDefinition) {
      const existing = `"${existingDefinition.plugin}" (${existingDefinition.path})`
      const current = `"${plugin.name}" (${plugin.path})`
      const base = `Plugins ${existing} and ${current} both provide "${role.name}"`
      const help = 'did you mean to use "implements"?'
      throw new Error(`${base} - ${help}`)
    }

    definitions[role.name] = {
      plugin: plugin.name,
      path: plugin.path,
      isAbstract: typeof role.path === 'undefined'
    }
  })

  return definitions
}

function assignFulfillers(fulfilled, plugin, roles) {
  (plugin.manifest.roles || []).forEach(role => {
    if (!role.path && !role.srcPath) {
      return
    }

    const implRoleName = role.implements || role.name
    if (!roles.definitions[implRoleName]) {
      throw new Error(
        `Plugin "${plugin.name}" tried to implement role "${implRoleName}", which is not defined. Missing a plugin?`
      )
    }

    if (role.implements && !roles.definitions[role.implements].isAbstract) {
      throw new Error([
        `Plugin "${plugin.name}" tried to implement role "${implRoleName}", which is not `,
        'an abstract role (a path was specified when defining it, which disallows overriding)'
      ].join(''))
    }

    const isLib = plugin.path.split(path.sep).indexOf('node_modules') !== -1
    const rolePath = isLib ? role.path : (role.srcPath || role.path);

    // A role can both implement a role and define a new one
    ['implements', 'name'].forEach(key => {
      const roleName = role[key]
      if (!roleName) {
        return
      }

      if (!fulfilled[roleName]) {
        fulfilled[roleName] = fulfilled[roleName] || []
      }

      fulfilled[roleName].push({
        plugin: plugin.name,
        path: path.resolve(path.join(plugin.path, rolePath))
      })
    })
  })

  return fulfilled
}

function flattenTree(target, plugin, index) {
  if (!plugin.plugins && plugin.plugins.length) {
    return target
  }

  const children = plugin.plugins.reduce(flattenTree, plugin.plugins)

  // Clone the target (because mutation is bad, right?)
  const newTarget = target.slice()

  // Add all the plugins that this plugin depend on,
  // before the current plugin in the chain
  Array.prototype.splice.apply(
    newTarget,
    [target.indexOf(plugin), 0].concat(children)
  )

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
    .then(manifest => validateManifest(manifest, options.plugin))
    .catch(err => {
      if (err.code === 'ENOENT' && options.plugin) {
        throw new Error(`No "sanity.json" file found in plugin "${options.plugin}"`)
      } else if (err.name === 'ValidationError' && options.plugin) {
        err.message = `Error while reading "${options.plugin}" manifest:\n${err.message}`
      } else if (err.name === 'ValidationError') {
        err.message = `Error while reading "${options.basePath}/sanity.json":\n${err.message}`
      }

      throw err
    })
}

function resolvePluginPath(plugin) {
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

  locations = uniq(locations)

  return Promise.all(locations.map(forgiveNonExistence))
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

function forgiveNonExistence(location) {
  return fsp.stat(location).catch(() => false)
}
