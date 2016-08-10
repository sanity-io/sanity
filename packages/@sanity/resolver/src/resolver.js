import path from 'path'
import generateHelpUrl from '@sanity/generate-help-url'
import flattenTree from './flattenTree'
import readManifest from './readManifest'
import resolvePlugins from './resolvePlugins'
import resolveSanityRoot from './resolveProjectRoot'
import removeDuplicatePlugins from './removeDuplicatePlugins'

export default function resolveTree(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  if (options.resolveProjectRoot) {
    // @todo Sync vs async
    const resolveOpts = Object.assign({}, options, {sync: true})
    options.basePath = resolveSanityRoot(resolveOpts)
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
    .then(removeDuplicatePlugins)
}

export function resolveRoles(options = {}) {
  if (options.sync) {
    return mergeResult(resolveTree(options), options)
  }

  return resolveTree(options).then(plugins => mergeResult(plugins, options))
}

export const resolveProjectRoot = resolveSanityRoot

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
  const definitions = {}
  const implementations = {}
  const result = {definitions, implementations, plugins}

  // Find plugins that define roles, and do a basic validation on the syntax
  const rolePlugins = plugins.map(plugin => {
    if (!plugin.manifest.roles) {
      return false
    }

    if (!Array.isArray(plugin.manifest.roles)) {
      const help = `See ${generateHelpUrl('plugin-roles-syntax')}`
      throw new Error(
        `Plugin "${plugin.name}" has a "roles" property which is not an array\n${help}`
      )
    }

    return {
      roles: plugin.manifest.roles,
      plugin: plugin
    }
  }).filter(Boolean).reverse()

  rolePlugins.forEach(({roles, plugin}) => {
    roles.forEach(role => {
      if (role.name && role.path) {
        assignNonOverridableRole(plugin, role, implementations, definitions)
      } else if (role.name) {
        assignDefinitionForAbstractRole(plugin, role, definitions)
      }

      if (role.implements) {
        assignRoleImplementation(plugin, role, implementations, definitions)
      }
    })
  })

  return result
}

function assignNonOverridableRole(plugin, role, implementations, definitions) {
  // Actual, non-overridable role
  const prevDefinition = definitions[role.name]
  if (prevDefinition) {
    // Role already exists, non-overridable roles can't be redefined
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `Plugins ${existing} and ${current} both define role "${role.name}"`
      + ' - did you mean to use "implements"?\n'
      + 'See ' + generateHelpUrl('role-declare-vs-implement')
    )
  }

  definitions[role.name] = getDefinitionDeclaration(plugin, role)
  implementations[role.name] = [getImplementationDeclaration(plugin, role)]
}

function assignDefinitionForAbstractRole(plugin, role, definitions) {
  const prevDefinition = definitions[role.name]
  if (prevDefinition && !prevDefinition.loose) {
    // Role already exists, non-overridable roles can't be redefined
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `Plugins ${existing} and ${current} both define role "${role.name}"`
      + ' - did you mean to use "implements"?\n'
      + 'See ' + generateHelpUrl('role-declare-vs-implement')
    )
  }

  definitions[role.name] = getDefinitionDeclaration(plugin, role)
}

function assignRoleImplementation(plugin, role, implementations, definitions) {
  const roleName = role.implements
  if (!role.path) {
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `Plugin ${current} tries to implement a role "${roleName}",`
      + ' but did not define a path. Did you mean to use "name"?\n'
      + 'See ' + generateHelpUrl('role-declare-vs-implement')
    )
  }

  const prevDefinition = definitions[roleName]
  if (prevDefinition && !prevDefinition.isAbstract) {
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `Plugin ${current} tried to implement role "${roleName}", which is already declared`
      + ` as a non-overridable role by ${existing} - `
      + 'See ' + generateHelpUrl('implement-non-overridable-role')
    )
  } else if (!prevDefinition) {
    // In some cases, a user might want to declare a new role name and
    // assign it a non-overridable implementation, while simulatenously
    // fulfilling an existing role using `implements`. In this case,
    // `name`, `implements` and `path` are all set, and we want the role
    // referenced in `implements` to be treated as a non-abstract role.
    // This is why we're explicitly setting `isAbstract` to true below
    // `loose` means that this declaration is "implicit" - the role isn't
    // defined as a `name` + `description` combination, so if we come across
    // a plugin that declares the role outright, we want to use that over this
    definitions[roleName] = getDefinitionDeclaration(plugin, role, {
      isAbstract: true,
      loose: true
    })
  }

  if (!implementations[roleName]) {
    implementations[roleName] = []
  }

  implementations[roleName].push(getImplementationDeclaration(plugin, role))
}

function getDefinitionDeclaration(plugin, role, options = {}) {
  const isAbstract = typeof options.isAbstract === 'undefined'
    ? typeof role.path === 'undefined'
    : options.isAbstract

  return {
    plugin: plugin.name,
    path: plugin.path,
    description: role.description,
    isAbstract: isAbstract,
    loose: options.loose
  }
}

function getImplementationDeclaration(plugin, role) {
  const paths = plugin.manifest.paths || {}
  const isLib = plugin.path.split(path.sep).indexOf('node_modules') !== -1
  const isDotPath = /^\.{1,2}[\\/]/.test(role.path)

  const basePath = isDotPath
    ? plugin.path
    : path.join(plugin.path, (isLib ? paths.compiled : paths.source) || '')

  const filePath = path.isAbsolute(role.path)
    ? role.path
    : path.resolve(path.join(basePath, role.path))

  return {
    plugin: plugin.name,
    path: filePath
  }
}
