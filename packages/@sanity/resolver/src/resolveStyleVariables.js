import {resolveRoles} from './resolver'
import isPlainObject from 'lodash/isPlainObject'
import merge from 'lodash/merge'

const roleName = 'style-variables'

function resolveStyleVars(opts) {
  return resolveRoles(opts)
    .then(res => validateFulfillers(res.fulfilled[roleName]))
    .then(vars => merge({}, ...vars.reverse()))
}

function validateFulfillers(fulfillers) {
  if (!fulfillers) {
    throw new Error(`Role "${roleName}" must be fulfilled. Did you forgot to include "@sanity/base" in your plugins?`)
  }

  if (!Array.isArray(fulfillers)) {
    throw new Error(`Role "${roleName}" must be marked as being multi-fulfillable.`)
  }

  return fulfillers.map(fulfiller => {
    const module = getModule(fulfiller)
    if (!isPlainObject(module)) {
      throw new Error(`Fulfillers of "${roleName}" must export a plain object, "${fulfiller.plugin}" did not`)
    }

    return module
  })
}

function getModule(fulfiller) {
  const module = require(fulfiller.path)
  return module.__esModule && module.default
    ? module.default
    : module
}

export default resolveStyleVars
