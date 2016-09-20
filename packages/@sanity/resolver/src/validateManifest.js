import generateHelpUrl from '@sanity/generate-help-url'

const matchers = {
  partPrefix: /^part:/,
  partPackage: /^part:[@A-Za-z0-9_-]+\//,
  partComponent: /^part:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/,
  partMultiPrefixed: /:.*?:/
}

export default function validateManifest(manifest, plugin) {
  const hasPlugins = isDefined(manifest.plugins)
  if (hasPlugins && !Array.isArray(manifest.plugins)) {
    throw new Error(`Plugin "${plugin}" has a non-array "plugins" property. Must be an array.`)
  }

  if (hasPlugins && manifest.plugins.some(hasDuplicate)) {
    throw new Error(`Plugin "${plugin}" has duplicate values in its "plugins" property.`)
  }

  if (isDefined(manifest.parts) && !Array.isArray(manifest.parts)) {
    throw new Error(`Plugin "${plugin}" has a non-array "parts" property. Must be an array.`)
  }

  (manifest.parts || []).forEach((part, i) => {
    const baseError = `Part defined at index ${i} of plugin "${plugin}" is invalid`
    const isImplementation = isDefined(part.path)

    const hasPart = isDefined(part.name) || isDefined(part.implements)
    if (isImplementation && !hasPart) {
      throw new Error([
        baseError,
        'A part that has a defined `path` needs to also define either `name` or `implements`',
        `See ${generateHelpUrl('plugin-parts-syntax')}`
      ].join('\n'))
    }

    if (!isDefined(part.path) && !isDefined(part.description)) {
      throw new Error([
        baseError,
        'A part that has not defined a `path` needs to include a `description`',
        `See ${generateHelpUrl('plugin-parts-syntax')}`
      ].join('\n'))
    }

    if (isDefined(part.name)) {
      validatePartName(part.name, baseError)
    }

    if (isDefined(part.implements)) {
      validatePartName(part.implements, baseError)
    }

    if (isDefined(part.description)) {
      validateDescription(part.description, baseError)
    }
  })

  return manifest
}

function validateDescription(desc, baseError) {
  if (typeof desc !== 'string' || desc.trim().length === 0) {
    throw new Error(`${baseError}\nDescription must be a non-empty string`)
  }
}

function validatePartName(name, baseError) {
  const examples = [
    'Examples:',
    '- part:package-name/part-name',
    '- part:package-name/part-name-style', '',
    `See ${generateHelpUrl('part-name-format')}`
  ].join('\n')

  if (name.indexOf('all:') !== -1) {
    throw new Error(
      `${baseError}\nPart "${name}" is invalid - can't contain "all:". ${examples}`
    )
  }

  if (matchers.partMultiPrefixed.test(name)) {
    throw new Error(
      `${baseError}\nPart "${name}" is invalid - can't contain multiple ":". ${examples}`
    )
  }

  if (!matchers.partPrefix.test(name)) {
    throw new Error(
      `${baseError}\nPart "${name}" is invalid - it needs a "part:"-prefix. ${examples}`
    )
  }

  if (!matchers.partPackage.test(name)) {
    throw new Error(
      `${baseError}\nPart "${name}" is invalid - it needs to include the plugin name. ${examples}`
    )
  }

  if (!matchers.partComponent.test(name)) {
    throw new Error(
      `${baseError}\nPart "${name}" is invalid - it needs to include a name after the plugin name. ${examples}`
    )
  }
}

function isDefined(thing) {
  return typeof thing !== 'undefined'
}

function hasDuplicate(value, index, array) {
  return array.indexOf(value, index + 1) !== -1
}
