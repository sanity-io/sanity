import fs from 'fs'
import path from 'path'
import generateHelpUrl from '@sanity/generate-help-url'
import flattenTree from './flattenTree'
import readManifest from './readManifest'
import {resolvePlugins, resolvePlugin} from './resolvePlugins'
import resolveSanityRoot from './resolveProjectRoot'
import removeDuplicatePlugins from './removeDuplicatePlugins'

export default resolveTree
export const resolveProjectRoot = resolveSanityRoot
export {resolvePlugin}

export function resolveParts(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  if (options.sync) {
    return mergeResult(resolveTree(options), options)
  }

  return resolveTree(options).then((plugins) => mergeResult(plugins, options))
}

function resolveTreeSync(options) {
  const basePath = options.basePath || process.cwd()
  const manifest = readManifest(options)
  const plugins = resolvePlugins(manifest.plugins || [], options).concat([
    getProjectRootPlugin(basePath, manifest),
  ])

  return plugins.reduce(flattenTree, plugins.slice())
}

async function resolveTreeAsync(options) {
  const projectManifest = await readManifest(options)
  const plugins = await resolvePlugins(projectManifest.plugins || [], options)
  const withRoot = plugins.concat([getProjectRootPlugin(options.basePath, projectManifest)])
  const flattened = withRoot.reduce(flattenTree, withRoot)
  const deduped = removeDuplicatePlugins(flattened)
  return deduped
}

function resolveTree(opts = {}) {
  const options = Object.assign({basePath: process.cwd()}, opts)

  if (options.resolveProjectRoot) {
    // @todo Sync vs async
    const resolveOpts = Object.assign({}, options, {sync: true})
    options.basePath = resolveSanityRoot(resolveOpts)
  }

  return options.sync ? resolveTreeSync(options) : resolveTreeAsync(options)
}

function getProjectRootPlugin(basePath, manifest) {
  return {
    name: '(project root)',
    path: basePath,
    manifest: manifest,
    plugins: [],
  }
}

function mergeResult(plugins, options = {}) {
  const definitions = {}
  const implementations = {}
  const result = {definitions, implementations, plugins}

  // Find plugins that define parts, and do a basic validation on the syntax
  const partPlugins = plugins
    .map((plugin) => {
      if (!plugin.manifest.parts) {
        return false
      }

      if (!Array.isArray(plugin.manifest.parts)) {
        const help = `See ${generateHelpUrl('plugin-parts-syntax')}`
        throw new Error(
          `Plugin "${plugin.name}" has a "parts" property which is not an array\n${help}`
        )
      }

      return {
        parts: plugin.manifest.parts,
        plugin: plugin,
      }
    })
    .filter(Boolean)
    .reverse()

  partPlugins.forEach(({parts, plugin}) => {
    parts.forEach((part) => {
      if (part.name && part.path) {
        assignNonOverridablePart(plugin, part, implementations, definitions, options)
      } else if (part.name) {
        assignDefinitionForAbstractPart(plugin, part, definitions)
      }

      if (part.implements) {
        assignPartImplementation(plugin, part, implementations, definitions, options)
      }
    })
  })

  return result
}

function assignNonOverridablePart(plugin, part, implementations, definitions, options) {
  // Actual, non-overridable part
  const prevDefinition = definitions[part.name]
  if (prevDefinition) {
    // Part already exists, non-overridable parts can't be redefined
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `${
        `Plugins ${existing} and ${current} both define part "${part.name}"` +
        ' - did you mean to use "implements"?\n' +
        'See '
      }${generateHelpUrl('part-declare-vs-implement')}`
    )
  }

  definitions[part.name] = getDefinitionDeclaration(plugin, part)
  implementations[part.name] = [getImplementationDeclaration(plugin, part, options)]
}

function assignDefinitionForAbstractPart(plugin, part, definitions) {
  const prevDefinition = definitions[part.name]
  if (prevDefinition && !prevDefinition.loose) {
    // Part already exists, non-overridable parts can't be redefined
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `${
        `Plugins ${existing} and ${current} both define part "${part.name}"` +
        ' - did you mean to use "implements"?\n' +
        'See '
      }${generateHelpUrl('part-declare-vs-implement')}`
    )
  }

  definitions[part.name] = getDefinitionDeclaration(plugin, part)
}

function assignPartImplementation(plugin, part, implementations, definitions, options) {
  const partName = part.implements
  if (!part.path) {
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `${
        `Plugin ${current} tries to implement a part "${partName}",` +
        ' but did not define a path. Did you mean to use "name"?\n' +
        'See '
      }${generateHelpUrl('part-declare-vs-implement')}`
    )
  }

  const prevDefinition = definitions[partName]
  if (prevDefinition && !prevDefinition.isAbstract) {
    const existing = `"${prevDefinition.plugin}" (${prevDefinition.path})`
    const current = `"${plugin.name}" (${plugin.path})`
    throw new Error(
      `${
        `Plugin ${current} tried to implement part "${partName}", which is already declared` +
        ` as a non-overridable part by ${existing} - ` +
        'See '
      }${generateHelpUrl('implement-non-overridable-part')}`
    )
  } else if (!prevDefinition) {
    // In some cases, a user might want to declare a new part name and
    // assign it a non-overridable implementation, while simulatenously
    // fulfilling an existing part using `implements`. In this case,
    // `name`, `implements` and `path` are all set, and we want the part
    // referenced in `implements` to be treated as a non-abstract part.
    // This is why we're explicitly setting `isAbstract` to true below
    // `loose` means that this declaration is "implicit" - the part isn't
    // defined as a `name` + `description` combination, so if we come across
    // a plugin that declares the part outright, we want to use that over this
    definitions[partName] = getDefinitionDeclaration(plugin, part, {
      isAbstract: true,
      loose: true,
    })
  }

  if (!implementations[partName]) {
    implementations[partName] = []
  }

  implementations[partName].push(getImplementationDeclaration(plugin, part, options))
}

function getDefinitionDeclaration(plugin, part, options = {}) {
  const isAbstract =
    typeof options.isAbstract === 'undefined'
      ? typeof part.path === 'undefined'
      : options.isAbstract

  return {
    plugin: plugin.name,
    path: plugin.path,
    description: part.description,
    isAbstract: isAbstract,
    loose: options.loose,
  }
}

function getImplementationDeclaration(plugin, part, options) {
  const paths = plugin.manifest.paths || {}

  let pluginPath = plugin.path

  if (options.isSanityMonorepo) {
    pluginPath = tryResolvePath(pluginPath)
  }

  const isLib = pluginPath.split(path.sep).indexOf('node_modules') !== -1
  const isDotPath = /^\.{1,2}[\\/]/.test(part.path)
  const useCompiled = options.useCompiledPaths || isLib

  const basePath = isDotPath
    ? pluginPath
    : path.join(pluginPath, (useCompiled ? paths.compiled : paths.source) || '')

  const filePath = path.isAbsolute(part.path)
    ? part.path
    : path.resolve(path.join(basePath, part.path))

  return {
    plugin: plugin.name,
    path: filePath,
  }
}

function tryResolvePath(dstPath) {
  try {
    return fs.realpathSync(dstPath)
  } catch (err) {
    return dstPath
  }
}
