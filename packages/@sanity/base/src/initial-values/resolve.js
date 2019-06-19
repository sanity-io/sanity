import {isPlainObject} from 'lodash'
import {validateInitialValue} from './validate'

async function resolveInitialValue(template, params = {}) {
  // Template builder?
  if (typeof template.serialize === 'function') {
    return resolveInitialValue(template.serialize(), params)
  }

  const {id, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  // Static value?
  if (isPlainObject(value)) {
    return validateInitialValue(value, template)
  }

  // Not an object, so should be a function
  if (typeof value !== 'function') {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function`
    )
  }

  const resolved = await value(params)
  return validateInitialValue(resolved, template)
}

export {resolveInitialValue}
