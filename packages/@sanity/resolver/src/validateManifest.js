import Joi from 'joi'

const matchers = {
  rolePrefix: /^[a-z]+:/,
  rolePackage: /^[a-z]+:[@A-Za-z0-9_-]+\//,
  roleComponent: /^[a-z]+:[@A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+/,
  roleMultiPrefixed: /:.*?:/
}

const schema = Joi.object({
  plugins: Joi.array().items(Joi.string().lowercase()).unique(),
  roles: Joi.array().items(Joi.object())
}).unknown(true)

export default function validateManifest(manifest, plugin) {
  const {error} = Joi.validate(manifest, schema, {convert: false})
  if (error) {
    throw error
  }

  (manifest.roles || []).forEach((role, i) => {
    const baseError = `Role defined at index ${i} of plugin "${plugin}" is invalid`
    const isImplementation = isDefined(role.path)

    if (!isImplementation && isDefined(role.srcPath)) {
      throw new Error([
        baseError,
        'A role that has a defined `srcPath` also needs to define a `path` (compiled version).',
        'If the file does not need to be compiled, use `path` instead of `srcPath`'
      ].join('\n'))
    }

    if (!isImplementation && (!isDefined(role.name) || !isDefined(role.description))) {
      throw new Error([
        baseError,
        'A role definition needs to define `name` and `description`,',
        'an implementation needs to define `path` and either `implements` or `name`'
      ].join('\n'))
    }

    const hasRole = isDefined(role.name) || isDefined(role.implements)
    if (isImplementation && !hasRole) {
      throw new Error([
        baseError,
        'A role that has a defined `path` needs to also define either `name` or `implements`',
      ].join('\n'))
    }

    if (isDefined(role.name)) {
      validateRoleName(role.name, baseError)
    }

    if (isDefined(role.implements)) {
      validateRoleName(role.implements, baseError)
    }

    if (isDefined(role.description)) {
      validateDescription(role.description, baseError)
    }
  })

  return Promise.resolve(manifest)
}

function validateDescription(desc, baseError) {
  if (typeof desc !== 'string' || desc.trim().length === 0) {
    throw new Error(`${baseError}\nDescription must be a non-empty string`)
  }
}

function validateRoleName(name, baseError) {
  const examples = [
    'Examples:',
    '- component:package-name/role-name',
    '- style:package-name/role-name'
  ].join('\n')

  if (name.indexOf('all:') !== -1) {
    throw new Error(
      `${baseError}\nRole "${name}" is invalid - can't contain "all:". ${examples}`
    )
  }

  if (matchers.roleMultiPrefixed.test(name)) {
    throw new Error(
      `${baseError}\nRole "${name}" is invalid - can't contain multiple ":". ${examples}`
    )
  }

  if (!matchers.rolePrefix.test(name)) {
    throw new Error(
      `${baseError}\nRole "${name}" is invalid - it needs a prefix. ${examples}`
    )
  }

  if (!matchers.rolePackage.test(name)) {
    throw new Error(
      `${baseError}\nRole "${name}" is invalid - it needs to include the plugin name. ${examples}`
    )
  }

  if (!matchers.roleComponent.test(name)) {
    throw new Error(
      `${baseError}\nRole "${name}" is invalid - it needs to include a name after the plugin name. ${examples}`
    )
  }
}

function isDefined(thing) {
  return typeof thing !== 'undefined'
}
